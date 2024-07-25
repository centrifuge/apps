import { ActiveLoan, CreatedLoan, CurrencyBalance, ExternalLoan, findBalance, Price } from '@centrifuge/centrifuge-js'
import { roundDown, useBalances, useCentrifugeTransaction } from '@centrifuge/centrifuge-react'
import { Box, Button, CurrencyInput, InlineFeedback, Shelf, Stack, Text } from '@centrifuge/fabric'
import Decimal from 'decimal.js-light'
import { Field, FieldProps, Form, FormikProvider, useFormik } from 'formik'
import * as React from 'react'
import { combineLatest, switchMap } from 'rxjs'
import { Dec, min } from '../../utils/Decimal'
import { formatBalance } from '../../utils/formatting'
import { useFocusInvalidInput } from '../../utils/useFocusInvalidInput'
import { useLoans } from '../../utils/useLoans'
import { useBorrower } from '../../utils/usePermissions'
import { usePool } from '../../utils/usePools'
import {
  combine,
  max,
  maxNotRequired,
  maxPriceVariance,
  nonNegativeNumber,
  nonNegativeNumberNotRequired,
  required,
} from '../../utils/validation'
import { useChargePoolFees } from './ChargeFeesFields'

type RepayValues = {
  price: number | '' | Decimal
  interest: number | '' | Decimal
  amountAdditional: number | '' | Decimal
  quantity: number | ''
  fees: { id: string; amount: number | '' | Decimal }[]
}

export function ExternalRepayForm({ loan, destination }: { loan: ExternalLoan; destination: string }) {
  const pool = usePool(loan.poolId)
  const account = useBorrower(loan.poolId, loan.id)
  const balances = useBalances(account?.actingAddress)
  const balance = (balances && findBalance(balances.currencies, pool.currency.key)?.balance.toDecimal()) || Dec(0)
  const poolFees = useChargePoolFees(loan.poolId, loan.id)
  const loans = useLoans(loan.poolId)
  const destinationLoan = loans?.find((l) => l.id === destination) as CreatedLoan | ActiveLoan

  const { execute: doRepayTransaction, isLoading: isRepayLoading } = useCentrifugeTransaction(
    'Repay asset',
    (cent) =>
      (
        args: [
          loanId: string,
          poolId: string,
          quantity: Price,
          interest: CurrencyBalance,
          amountAdditional: CurrencyBalance,
          price: CurrencyBalance
        ],
        options
      ) => {
        const [loanId, poolId, quantity, interest, amountAdditional, price] = args
        let repayTx
        if (destination === 'reserve') {
          repayTx = cent.pools.repayExternalLoanPartially(
            [poolId, loanId, quantity, interest, amountAdditional, price],
            {
              batch: true,
            }
          )
        } else {
          const repay = { quantity, price, interest }
          let borrow = { quantity, price }
          repayTx = cent.pools.transferLoanDebt([poolId, loan.id, destinationLoan.id, repay, borrow], { batch: true })
        }
        return combineLatest([cent.getApi(), repayTx, poolFees.getBatch(repayForm)]).pipe(
          switchMap(([api, repayTx, batch]) => {
            if (batch.length) {
              return cent.wrapSignAndSend(api, api.tx.utility.batchAll([repayTx, ...batch], options))
            }
            return cent.wrapSignAndSend(api, repayTx, options)
          })
        )
      },
    {
      onSuccess: () => {
        repayForm.resetForm()
      },
    }
  )

  const { execute: doCloseTransaction, isLoading: isCloseLoading } = useCentrifugeTransaction(
    'Close asset',
    (cent) => cent.pools.closeLoan
  )

  const currentFace =
    loan?.pricing && 'outstandingQuantity' in loan.pricing
      ? loan.pricing.outstandingQuantity.toDecimal().mul(loan.pricing.notional.toDecimal())
      : null

  const repayForm = useFormik<RepayValues>({
    initialValues: {
      price: '',
      quantity: '',
      fees: [],
      interest: '',
      amountAdditional: '',
    },
    onSubmit: (values, actions) => {
      const price = CurrencyBalance.fromFloat(values.price, pool.currency.decimals)
      const interest = CurrencyBalance.fromFloat(values?.interest || 0, pool.currency.decimals)
      const amountAdditional = CurrencyBalance.fromFloat(values.amountAdditional || 0, pool.currency.decimals)
      const quantity = Price.fromFloat(values.quantity || 0)

      doRepayTransaction([loan.poolId, loan.id, quantity, interest, amountAdditional, price], {
        account,
      })
      actions.setSubmitting(false)
    },
    validateOnMount: true,
  })

  const repayFormRef = React.useRef<HTMLFormElement>(null)
  useFocusInvalidInput(repayForm, repayFormRef)

  if (loan.status === 'Closed' || ('valuationMethod' in loan.pricing && loan.pricing.valuationMethod !== 'oracle')) {
    return null
  }

  const debt = loan.outstandingDebt?.toDecimal() || Dec(0)
  const { availableDebt, maxInterest, currentInputsSum } = React.useMemo(() => {
    const outstandingInterest = (loan as ActiveLoan).outstandingInterest.toDecimal() ?? Dec(0)
    const currentInputsSum = Dec(repayForm.values.price || 0)
      .mul(repayForm.values.quantity || 0)
      .add(repayForm.values.interest || 0)
      .add(repayForm.values.amountAdditional || 0)
    if (destination === 'reserve') {
      return {
        availableDebt: min(balance, debt),
        maxInterest: outstandingInterest.gt(currentInputsSum)
          ? min(balance, outstandingInterest).sub(currentInputsSum)
          : Dec(0),
        currentInputsSum,
      }
    }
    return {
      availableDebt: destinationLoan.outstandingDebt?.toDecimal(),
      maxInterest: outstandingInterest.gt(currentInputsSum) ? outstandingInterest.sub(currentInputsSum) : Dec(0),
      currentInputsSum,
    }
  }, [loan, destinationLoan, balance, repayForm.values])

  console.log('🚀 ~ maxInterest:', maxInterest.toString())
  const totalRepay = currentInputsSum

  return (
    <>
      {currentFace ? (
        <Stack>
          <Shelf justifyContent="space-between">
            <Text variant="label2">Current face</Text>
            <Text variant="label2">{formatBalance(currentFace, pool.currency.symbol, 2, 2)}</Text>
          </Shelf>
        </Stack>
      ) : null}

      {loan.status !== 'Created' &&
        (debt.gt(0) ? (
          <FormikProvider value={repayForm}>
            <Stack as={Form} gap={2} noValidate ref={repayFormRef}>
              <Field validate={combine(required(), nonNegativeNumber())} name="quantity">
                {({ field, meta, form }: FieldProps) => {
                  return (
                    <CurrencyInput
                      {...field}
                      label="Quantity"
                      disabled={isRepayLoading}
                      errorMessage={meta.touched ? meta.error : undefined}
                      decimals={8}
                      onChange={(value) => form.setFieldValue('quantity', value)}
                      currency={pool.currency.symbol}
                    />
                  )
                }}
              </Field>
              <Field
                validate={combine(
                  required(),
                  nonNegativeNumber(),
                  max(
                    availableDebt.toNumber(),
                    `Quantity x price (${formatBalance(
                      Dec(repayForm.values.price || 0).mul(repayForm.values.quantity || 0),
                      pool.currency.symbol
                    )}) exceeds available debt (${formatBalance(availableDebt, pool.currency.symbol)})`
                  ),
                  maxPriceVariance(loan.pricing)
                )}
                name="price"
              >
                {({ field, meta, form }: FieldProps) => {
                  return (
                    <CurrencyInput
                      {...field}
                      label="Settlement price"
                      disabled={isRepayLoading}
                      errorMessage={meta.touched ? meta.error : undefined}
                      currency={pool.currency.symbol}
                      onChange={(value) => form.setFieldValue('price', value)}
                      decimals={8}
                    />
                  )
                }}
              </Field>
              {loan.outstandingInterest.toDecimal().gt(0) && (
                <Field
                  validate={combine(nonNegativeNumberNotRequired(), maxNotRequired(maxInterest.toNumber()))}
                  name="interest"
                >
                  {({ field, meta, form }: FieldProps) => {
                    return (
                      <CurrencyInput
                        {...field}
                        value={field.value instanceof Decimal ? field.value.toNumber() : field.value}
                        label="Interest"
                        errorMessage={meta.touched ? meta.error : undefined}
                        secondaryLabel={`${formatBalance(
                          loan.outstandingInterest,
                          pool?.currency.symbol,
                          2
                        )} interest accrued`}
                        disabled={isRepayLoading}
                        currency={pool?.currency.symbol}
                        onChange={(value) => form.setFieldValue('interest', value)}
                        onSetMax={() => form.setFieldValue('interest', maxInterest.toNumber())}
                      />
                    )
                  }}
                </Field>
              )}
              <Field
                name="amountAdditional"
                validate={combine(nonNegativeNumberNotRequired(), maxNotRequired(availableDebt.toNumber()))}
              >
                {({ field, meta, form }: FieldProps) => {
                  return (
                    <CurrencyInput
                      {...field}
                      value={field.value instanceof Decimal ? field.value.toNumber() : field.value}
                      label="Additional amount"
                      errorMessage={meta.touched ? meta.error : undefined}
                      disabled={isRepayLoading}
                      currency={pool?.currency.symbol}
                      onChange={(value) => form.setFieldValue('amountAdditional', value)}
                    />
                  )
                }}
              </Field>
              <Box bg="statusDefaultBg" p={1}>
                {destination === 'reserve' ? (
                  <InlineFeedback status="default">
                    <Text color="statusDefault">Stable-coins will be transferred to the onchain reserve.</Text>
                  </InlineFeedback>
                ) : (
                  <InlineFeedback status="default">
                    <Text color="statusDefault">
                      Virtual accounting process. No onchain stable-coin transfers are expected.
                    </Text>
                  </InlineFeedback>
                )}
              </Box>
              {poolFees.render()}
              <Stack gap={1}>
                <Shelf justifyContent="space-between">
                  <Text variant="emphasized">Total amount</Text>
                  <Text variant="emphasized">{formatBalance(totalRepay, pool?.currency.symbol, 2)}</Text>
                </Shelf>

                {poolFees.renderSummary()}

                <Shelf justifyContent="space-between">
                  <Text variant="emphasized">Available</Text>
                  <Text variant="emphasized">{formatBalance(availableDebt, pool?.currency.symbol, 2)}</Text>
                </Shelf>
              </Stack>
              {balance.lessThan(debt) && destination === 'reserve' && (
                <Box bg="statusWarningBg" p={1}>
                  <InlineFeedback status="warning">
                    <Text color="statusWarning">
                      Your wallet balance ({formatBalance(roundDown(balance), pool?.currency.symbol, 2)}) is smaller
                      than the outstanding balance({formatBalance(debt, pool.currency.symbol)}).
                    </Text>
                  </InlineFeedback>
                </Box>
              )}
              {totalRepay.gt(availableDebt) && (
                <Box bg="statusCriticalBg" p={1}>
                  <InlineFeedback status="critical">
                    <Text color="statusCritical">
                      The amount ({formatBalance(roundDown(totalRepay), pool?.currency.symbol, 2)}) is greater than the
                      available debt ({formatBalance(availableDebt, pool.currency.symbol)}).
                    </Text>
                  </InlineFeedback>
                </Box>
              )}
              <Stack gap={1} px={1}>
                <Button
                  type="submit"
                  disabled={
                    isRepayLoading ||
                    !poolFees.isValid(repayForm) ||
                    !repayForm.isValid ||
                    !totalRepay.lessThan(availableDebt)
                  }
                  loading={isRepayLoading}
                >
                  Sell
                </Button>
              </Stack>
            </Stack>
          </FormikProvider>
        ) : (
          <Button
            variant="secondary"
            loading={isCloseLoading}
            onClick={() => doCloseTransaction([loan.poolId, loan.id], { account, forceProxyType: 'Borrow' })}
          >
            Close
          </Button>
        ))}
    </>
  )
}
