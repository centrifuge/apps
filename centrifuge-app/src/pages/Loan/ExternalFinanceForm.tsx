import {
  ActiveLoan,
  CreatedLoan,
  CurrencyBalance,
  ExternalLoan,
  Pool,
  Price,
  WithdrawAddress,
} from '@centrifuge/centrifuge-js'
import { useCentrifugeApi, useCentrifugeTransaction, wrapProxyCallsForAccount } from '@centrifuge/centrifuge-react'
import { Button, CurrencyInput, InlineFeedback, Shelf, Stack, Text } from '@centrifuge/fabric'
import Decimal from 'decimal.js-light'
import { Field, FieldProps, Form, FormikProvider, useFormik, useFormikContext } from 'formik'
import * as React from 'react'
import { combineLatest, switchMap } from 'rxjs'
import { Dec, min } from '../../utils/Decimal'
import { formatBalance } from '../../utils/formatting'
import { useFocusInvalidInput } from '../../utils/useFocusInvalidInput'
import { useAvailableFinancing, useLoans } from '../../utils/useLoans'
import { useBorrower } from '../../utils/usePermissions'
import { usePool } from '../../utils/usePools'
import { combine, maxPriceVariance, positiveNumber, required } from '../../utils/validation'
import { useChargePoolFees } from './ChargeFeesFields'
import { useWithdraw } from './FinanceForm'

export type FinanceValues = {
  price: number | '' | Decimal
  quantity: number | ''
  withdraw: undefined | WithdrawAddress
  fees: { id: string; amount: '' | number | Decimal }[]
}

export function ExternalFinanceForm({ loan, source }: { loan: ExternalLoan; source: string }) {
  const pool = usePool(loan.poolId) as Pool
  const account = useBorrower(loan.poolId, loan.id)
  const poolFees = useChargePoolFees(loan.poolId, loan.id)
  const api = useCentrifugeApi()
  const loans = useLoans(loan.poolId)
  const { current: availableFinancing } = useAvailableFinancing(loan.poolId, loan.id)
  const { execute: doFinanceTransaction, isLoading: isFinanceLoading } = useCentrifugeTransaction(
    'Purchase asset',
    (cent) =>
      (
        args: [poolId: string, loanId: string, quantity: Price, price: CurrencyBalance, interest: CurrencyBalance],
        options
      ) => {
        if (!account) throw new Error('No borrower')
        const [poolId, loanId, quantity, price, interest] = args
        let financeTx
        if (source === 'reserve') {
          financeTx = cent.pools.financeExternalLoan([poolId, loanId, quantity, price], { batch: true })
        } else {
          const sourceLoan = loans?.find((l) => l.id === source) as CreatedLoan | ActiveLoan
          if (!sourceLoan) throw new Error('Target loan not found')
          const repay = { quantity, price, interest }
          let borrow = { quantity: quantity, price }
          financeTx = cent.pools.transferLoanDebt([poolId, sourceLoan.id, loan.id, repay, borrow], { batch: true })
        }
        return combineLatest([financeTx, withdraw.getBatch(financeForm), poolFees.getBatch(financeForm)]).pipe(
          switchMap(([loanTx, withdrawBatch, poolFeesBatch]) => {
            let batch = [...withdrawBatch, ...poolFeesBatch]
            let tx = wrapProxyCallsForAccount(api, loanTx, account, 'Borrow')
            if (batch.length) {
              tx = api.tx.utility.batchAll([tx, ...batch])
            }
            return cent.wrapSignAndSend(api, tx, { ...options, proxies: undefined })
          })
        )
      },
    {
      onSuccess: () => {
        financeForm.resetForm()
      },
    }
  )

  const financeForm = useFormik<FinanceValues>({
    initialValues: {
      price: '',
      quantity: '',
      withdraw: undefined,
      fees: [],
    },
    onSubmit: (values, actions) => {
      const price = CurrencyBalance.fromFloat(values.price, pool.currency.decimals)
      const quantity = Price.fromFloat(values.quantity)
      const interest = new CurrencyBalance(0, pool.currency.decimals)
      doFinanceTransaction([loan.poolId, loan.id, quantity, price, interest], {
        account,
      })
      actions.setSubmitting(false)
    },
    validateOnMount: true,
  })

  const financeFormRef = React.useRef<HTMLFormElement>(null)
  useFocusInvalidInput(financeForm, financeFormRef)

  const amountDec = Dec(financeForm.values.price || 0).mul(Dec(financeForm.values.quantity || 0))

  const withdraw = useWithdraw(loan.poolId, account!, amountDec)

  if (loan.status === 'Closed' || ('valuationMethod' in loan.pricing && loan.pricing.valuationMethod !== 'oracle')) {
    return null
  }

  const maturityDatePassed = loan?.pricing.maturityDate && new Date() > new Date(loan.pricing.maturityDate)

  return (
    <>
      {availableFinancing.greaterThan(0) && !maturityDatePassed && (
        <FormikProvider value={financeForm}>
          <Stack as={Form} gap={2} noValidate ref={financeFormRef}>
            <ExternalFinanceFields loan={loan} pool={pool} />
            {source === 'reserve' && withdraw.render()}
            {source === 'reserve' ? (
              <InlineFeedback>
                Stable-coins will be transferred to the specified withdrawl addresses, on the specified networks. A
                delay until the transfer is completed is to be expected.
              </InlineFeedback>
            ) : (
              <InlineFeedback>
                Virtual accounting process. No onchain stable-coin transfers are expected.
              </InlineFeedback>
            )}
            {poolFees.render()}
            <Stack gap={1}>
              <Shelf justifyContent="space-between">
                <Text variant="emphasized">Total amount</Text>
                <Text variant="emphasized">
                  {amountDec.gt(0)
                    ? formatBalance(amountDec, pool?.currency.symbol, 2)
                    : `0.00 ${pool.currency.symbol}`}
                </Text>
              </Shelf>
              {poolFees.renderSummary()}
            </Stack>
            <Stack px={1}>
              <Button
                type="submit"
                loading={isFinanceLoading}
                disabled={
                  !financeForm.values.price ||
                  !financeForm.values.quantity ||
                  !withdraw.isValid ||
                  !poolFees.isValid(financeForm)
                }
              >
                Purchase
              </Button>
            </Stack>
          </Stack>
        </FormikProvider>
      )}
    </>
  )
}

export function ExternalFinanceFields({
  loan,
  pool,
  validate,
}: {
  loan: ExternalLoan
  pool: Pool
  validate?: (val: any) => string
}) {
  const form = useFormikContext<FinanceValues>()
  const { current: availableFinancing } = useAvailableFinancing(loan.poolId, loan.id)
  const poolReserve = pool?.reserve.available.toDecimal() ?? Dec(0)
  const maxBorrow = min(poolReserve, availableFinancing).sub(
    form.values.fees.reduce((acc, fee) => acc.add(fee?.amount || 0), Dec(0)).toString()
  )
  return (
    <>
      <Field name="quantity" validate={combine(required(), positiveNumber())}>
        {({ field, meta, form }: FieldProps) => {
          return (
            <CurrencyInput
              {...field}
              label="Quantity"
              errorMessage={meta.touched ? meta.error : undefined}
              decimals={8}
              onChange={(value) => form.setFieldValue('quantity', value)}
            />
          )
        }}
      </Field>
      <Field
        name="price"
        validate={combine(
          required(),
          positiveNumber(),
          validate ??
            ((val) => {
              const financeAmount = Dec(val).mul(form.values.quantity || 1)

              return financeAmount.gt(maxBorrow)
                ? `Amount exceeds max borrow (${formatBalance(maxBorrow, pool.currency.symbol, 2)})`
                : ''
            }),
          maxPriceVariance(loan.pricing)
        )}
      >
        {({ field, meta, form }: FieldProps) => {
          return (
            <CurrencyInput
              {...field}
              label="Settlement price"
              errorMessage={meta.touched ? meta.error : undefined}
              currency={pool.currency.symbol}
              onChange={(value) => form.setFieldValue('price', value)}
              decimals={8}
            />
          )
        }}
      </Field>
    </>
  )
}
