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
import { Box, Button, CurrencyInput, InlineFeedback, Shelf, Stack, Text } from '@centrifuge/fabric'
import Decimal from 'decimal.js-light'
import { Field, FieldProps, Form, FormikProvider, useFormik } from 'formik'
import * as React from 'react'
import { combineLatest, switchMap } from 'rxjs'
import { Dec } from '../../utils/Decimal'
import { formatBalance } from '../../utils/formatting'
import { useFocusInvalidInput } from '../../utils/useFocusInvalidInput'
import { useLoans } from '../../utils/useLoans'
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
  const sourceLoan = loans?.find((l) => l.id === source) as CreatedLoan | ActiveLoan
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

  const totalFinance = Dec(financeForm.values.price || 0).mul(Dec(financeForm.values.quantity || 0))
  const maxAvailable =
    source === 'reserve' ? pool.reserve.available.toDecimal() : sourceLoan.outstandingDebt.toDecimal()

  const withdraw = useWithdraw(loan.poolId, account!, totalFinance)

  if (loan.status === 'Closed' || ('valuationMethod' in loan.pricing && loan.pricing.valuationMethod !== 'oracle')) {
    return null
  }

  const maturityDatePassed = loan?.pricing.maturityDate && new Date() > new Date(loan.pricing.maturityDate)

  return (
    <>
      {maxAvailable.greaterThan(0) && !maturityDatePassed && (
        <FormikProvider value={financeForm}>
          <Stack as={Form} gap={2} noValidate ref={financeFormRef}>
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
                (val) => {
                  const financeAmount = Dec(val).mul(financeForm.values.quantity || 1)
                  return financeAmount.gt(maxAvailable)
                    ? `Amount exceeds available (${formatBalance(maxAvailable, pool.currency.symbol, 2)})`
                    : ''
                },
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
            {source === 'reserve' && withdraw.render()}
            <Box bg="statusDefaultBg" p={1}>
              {source === 'reserve' ? (
                <InlineFeedback status="default">
                  <Text color="statusDefault">
                    Stablecoins will be transferred to the specified withdrawal addresses, on the specified networks. A
                    delay until the transfer is completed is to be expected.
                  </Text>
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
                <Text variant="emphasized">{formatBalance(totalFinance, pool?.currency.symbol, 2)}</Text>
              </Shelf>

              {poolFees.renderSummary()}

              <Shelf justifyContent="space-between">
                <Text variant="emphasized">Available</Text>
                <Text variant="emphasized">{formatBalance(maxAvailable, pool?.currency.symbol, 2)}</Text>
              </Shelf>
            </Stack>

            {totalFinance.gt(0) && totalFinance.gt(maxAvailable) && (
              <Box bg="statusCriticalBg" p={1}>
                <InlineFeedback status="critical">
                  <Text color="statusCritical">
                    Available financing ({formatBalance(maxAvailable, pool?.currency.symbol, 2)}) is smaller than the
                    total principal ({formatBalance(totalFinance, pool.currency.symbol)}).
                  </Text>
                </InlineFeedback>
              </Box>
            )}
            <Stack px={1}>
              <Button
                type="submit"
                loading={isFinanceLoading}
                disabled={
                  !financeForm.values.price ||
                  !financeForm.values.quantity ||
                  !withdraw.isValid ||
                  !poolFees.isValid(financeForm) ||
                  !financeForm.isValid
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
