import { ActiveLoan, CurrencyBalance, ExternalLoan, findBalance, Price } from '@centrifuge/centrifuge-js'
import { roundDown, useBalances, useCentrifugeTransaction } from '@centrifuge/centrifuge-react'
import { Box, Button, CurrencyInput, InlineFeedback, Shelf, Stack, Text } from '@centrifuge/fabric'
import { BN } from 'bn.js'
import Decimal from 'decimal.js-light'
import { Field, FieldProps, Form, FormikProvider, useFormik } from 'formik'
import * as React from 'react'
import { combineLatest, switchMap } from 'rxjs'
import { Dec, max as maxDec, min } from '../../utils/Decimal'
import { formatBalance } from '../../utils/formatting'
import { useFocusInvalidInput } from '../../utils/useFocusInvalidInput'
import { useLoans } from '../../utils/useLoans'
import { useBorrower } from '../../utils/usePermissions'
import { usePool } from '../../utils/usePools'
import { combine, maxNotRequired, nonNegativeNumberNotRequired } from '../../utils/validation'
import { useChargePoolFees } from './ChargeFeesFields'

type RepayValues = {
  price: number | '' | Decimal
  interest: number | '' | Decimal
  amountAdditional: number | '' | Decimal
  quantity: number | ''
  fees: { id: string; amount: number | '' | Decimal }[]
}
/**
 * Repay form for loans with `valuationMethod === oracle
 */
export function ExternalRepayForm({ loan, destination }: { loan: ExternalLoan; destination: string }) {
  const pool = usePool(loan.poolId)
  const account = useBorrower(loan.poolId, loan.id)
  const balances = useBalances(account?.actingAddress)
  const balance = (balances && findBalance(balances.currencies, pool.currency.key)?.balance.toDecimal()) || Dec(0)
  const poolFees = useChargePoolFees(loan.poolId, loan.id)
  const loans = useLoans(loan.poolId)
  const destinationLoan = loans?.find((l) => l.id === destination) as ActiveLoan

  const { execute: doRepayTransaction, isLoading: isRepayLoading } = useCentrifugeTransaction(
    'Sell asset',
    (cent) =>
      (
        args: [quantity: Price, interest: CurrencyBalance, amountAdditional: CurrencyBalance, price: CurrencyBalance],
        options
      ) => {
        const [quantity, interest, amountAdditional, price] = args
        let repayTx
        if (destination === 'reserve') {
          repayTx = cent.pools.repayExternalLoanPartially(
            [pool.id, loan.id, quantity, interest, amountAdditional, price],
            {
              batch: true,
            }
          )
        } else {
          const repay = { quantity, price, interest, unscheduled: amountAdditional }
          const principal = new CurrencyBalance(
            price.mul(new BN(quantity.toDecimal().toString())),
            pool.currency.decimals
          )
          let borrow = {
            amount: new CurrencyBalance(
              principal.add(interest).add(amountAdditional).toString(),
              pool.currency.decimals
            ),
          }
          repayTx = cent.pools.transferLoanDebt([pool.id, loan.id, destinationLoan.id, repay, borrow], { batch: true })
        }
        return combineLatest([cent.getApi(), repayTx, poolFees.getBatch(repayForm)]).pipe(
          switchMap(([api, repayTx, batch]) => {
            if (batch.length) {
              return cent.wrapSignAndSend(api, api.tx.utility.batchAll([repayTx, ...batch]), options)
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
      const price = CurrencyBalance.fromFloat(values.price || 0, pool.currency.decimals)
      const interest = CurrencyBalance.fromFloat(values?.interest || 0, pool.currency.decimals)
      const amountAdditional = CurrencyBalance.fromFloat(values.amountAdditional || 0, pool.currency.decimals)
      const quantity = Price.fromFloat(values.quantity || 0)

      doRepayTransaction([quantity, interest, amountAdditional, price], {
        account,
      })
      actions.setSubmitting(false)
    },
    validateOnMount: true,
  })

  const repayFormRef = React.useRef<HTMLFormElement>(null)
  useFocusInvalidInput(repayForm, repayFormRef)

  const debt = ('outstandingDebt' in loan && loan.outstandingDebt?.toDecimal()) || Dec(0)
  const { maxAvailable, maxInterest, totalRepay } = React.useMemo(() => {
    const outstandingInterest = (loan as ActiveLoan).outstandingInterest.toDecimal() ?? Dec(0)
    const { quantity, interest, amountAdditional, price } = repayForm.values
    const totalRepay = Dec(price || 0)
      .mul(quantity || 0)
      .add(interest || 0)
      .add(amountAdditional || 0)
    let maxAvailable = min(balance, debt)
    let maxInterest = min(balance, outstandingInterest)
    if (destination !== 'reserve') {
      maxAvailable = destinationLoan.outstandingDebt?.toDecimal() || Dec(0)
      maxInterest = outstandingInterest || Dec(0)
    }
    return {
      maxAvailable,
      maxInterest: maxDec(
        min(maxInterest, maxAvailable.sub(Dec(price || 0).mul(quantity || 0) || 0).sub(amountAdditional || 0)),
        Dec(0)
      ),
      totalRepay,
    }
  }, [loan, destinationLoan, balance, repayForm.values])

  if (loan.status === 'Closed' || ('valuationMethod' in loan.pricing && loan.pricing.valuationMethod !== 'oracle')) {
    return null
  }

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
              <Field validate={combine(nonNegativeNumberNotRequired())} name="quantity">
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
                  nonNegativeNumberNotRequired(),
                  maxNotRequired(
                    maxAvailable.toNumber(),
                    `Quantity x price (${formatBalance(
                      Dec(repayForm.values.price || 0).mul(repayForm.values.quantity || 0),
                      pool.currency.symbol
                    )}) exceeds available debt (${formatBalance(maxAvailable, pool.currency.symbol)})`
                  )
                )}
                name="price"
              >
                {({ field, form }: FieldProps) => {
                  return (
                    <CurrencyInput
                      {...field}
                      label="Settlement price"
                      disabled={isRepayLoading}
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
                validate={combine(nonNegativeNumberNotRequired(), maxNotRequired(maxAvailable.toNumber()))}
              >
                {({ field, form }: FieldProps) => {
                  return (
                    <CurrencyInput
                      {...field}
                      value={field.value instanceof Decimal ? field.value.toNumber() : field.value}
                      label="Additional amount"
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
                    <Text color="statusDefault">Stablecoins will be transferred to the onchain reserve.</Text>
                  </InlineFeedback>
                ) : (
                  <InlineFeedback status="default">
                    <Text color="statusDefault">
                      Virtual accounting process. No onchain stablecoin transfers are expected.
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
                  <Text variant="emphasized">{formatBalance(maxAvailable, pool?.currency.symbol, 2)}</Text>
                </Shelf>
              </Stack>
              {balance.lessThan(debt) && destination === 'reserve' && (
                <Box bg="statusWarningBg" p={1}>
                  <InlineFeedback status="warning">
                    <Text color="statusWarning">
                      Your wallet balance ({formatBalance(roundDown(balance), pool?.currency.symbol, 2)}) is smaller
                      than the outstanding balance ({formatBalance(debt, pool.currency.symbol)}).
                    </Text>
                  </InlineFeedback>
                </Box>
              )}
              {totalRepay.gt(maxAvailable) && (
                <Box bg="statusCriticalBg" p={1}>
                  <InlineFeedback status="critical">
                    <Text color="statusCritical">
                      The amount ({formatBalance(roundDown(totalRepay), pool?.currency.symbol, 2)}) is greater than the
                      available debt ({formatBalance(maxAvailable, pool.currency.symbol)}).
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
                    totalRepay.greaterThan(maxAvailable)
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
