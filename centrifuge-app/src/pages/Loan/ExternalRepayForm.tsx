import { ActiveLoan, CreatedLoan, CurrencyBalance, ExternalLoan, findBalance, Price } from '@centrifuge/centrifuge-js'
import { roundDown, useBalances, useCentrifugeTransaction } from '@centrifuge/centrifuge-react'
import { Button, CurrencyInput, Shelf, Stack, Text } from '@centrifuge/fabric'
import Decimal from 'decimal.js-light'
import { Field, FieldProps, Form, FormikProvider, useFormik } from 'formik'
import * as React from 'react'
import { combineLatest, switchMap } from 'rxjs'
import { useLoans } from 'src/utils/useLoans'
import { Dec } from '../../utils/Decimal'
import { formatBalance } from '../../utils/formatting'
import { useFocusInvalidInput } from '../../utils/useFocusInvalidInput'
import { useBorrower } from '../../utils/usePermissions'
import { usePool } from '../../utils/usePools'
import { combine, maxPriceVariance, nonNegativeNumber, positiveNumber, required } from '../../utils/validation'
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
        const principal = quantity.mul(price)
        let repayTx
        if (destination === 'reserve') {
          repayTx = cent.pools.repayExternalLoanPartially(
            [poolId, loanId, quantity, interest, amountAdditional, price],
            {
              batch: true,
            }
          )
        } else {
          const toLoan = loans?.find((l) => l.id === destination) as CreatedLoan | ActiveLoan
          if (!toLoan) throw new Error('toLoan not found')
          const repay = { quantity, price, interest }

          let borrow = { amount: principal }
          repayTx = cent.pools.transferLoanDebt([poolId, loan.id, toLoan.id, repay, borrow], { batch: true })
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
              <Field validate={combine(required(), positiveNumber())} name="quantity">
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
                  (val) => {
                    const num = val instanceof Decimal ? val.toNumber() : val
                    const repayAmount = Dec(num).mul(repayForm.values.quantity)

                    return repayAmount.gt(balance)
                      ? `Your wallet balance (${formatBalance(
                          roundDown(balance),
                          pool?.currency.symbol,
                          2
                        )}) is smaller than
                    the outstanding balance.`
                      : ''
                  },
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
                <Field validate={nonNegativeNumber()} name="interest">
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
                        onSetMax={() => form.setFieldValue('interest', loan.outstandingInterest.toDecimal())}
                      />
                    )
                  }}
                </Field>
              )}
              {destination === 'reserve' && (
                <Field name="amountAdditional" validate={nonNegativeNumber()}>
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
              )}
              {poolFees.render()}
              <Stack gap={1}>
                <Shelf justifyContent="space-between">
                  <Text variant="emphasized">
                    Total amount {repayForm.values.fees.find((fee) => fee.amount) ? '(incl. fees)' : null}
                  </Text>
                  <Text variant="emphasized">
                    {repayForm.values.price && !Number.isNaN(repayForm.values.price as number)
                      ? formatBalance(
                          Dec(repayForm.values.price || 0)
                            .mul(Dec(repayForm.values.quantity || 0))
                            .sub(
                              repayForm.values.fees.reduce((acc, fee) => acc.add(fee?.amount || 0), Dec(0)).toString()
                            ),
                          pool?.currency.symbol,
                          2
                        )
                      : `0.00 ${pool.currency.symbol}`}
                  </Text>
                </Shelf>
              </Stack>
              <Stack gap={1} px={1}>
                <Button
                  type="submit"
                  disabled={
                    isRepayLoading ||
                    !poolFees.isValid(repayForm) ||
                    !repayForm.values.price ||
                    !repayForm.values.quantity ||
                    Object.keys(repayForm.errors).length > 0
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
