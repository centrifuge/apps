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
import { Box, Button, CurrencyInput, InlineFeedback, Shelf, Stack, Text, Tooltip } from '@centrifuge/fabric'
import { BN } from 'bn.js'
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

/**
 * Finance form for loans with `valuationMethod === oracle`
 */
export function ExternalFinanceForm({ loan, source }: { loan: ExternalLoan; source: string }) {
  const pool = usePool(loan.poolId) as Pool
  const account = useBorrower(loan.poolId, loan.id)
  const poolFees = useChargePoolFees(loan.poolId, loan.id)
  const api = useCentrifugeApi()
  const loans = useLoans(loan.poolId)
  const sourceLoan = loans?.find((l) => l.id === source) as CreatedLoan | ActiveLoan
  const displayCurrency = source === 'reserve' ? pool.currency.symbol : 'USD'
  const { execute: doFinanceTransaction, isLoading: isFinanceLoading } = useCentrifugeTransaction(
    'Purchase asset',
    (cent) => (args: [poolId: string, loanId: string, quantity: Price, price: CurrencyBalance], options) => {
      if (!account) throw new Error('No borrower')
      const [poolId, loanId, quantity, price] = args
      let financeTx
      if (source === 'reserve') {
        financeTx = cent.pools.financeExternalLoan([poolId, loanId, quantity, price], { batch: true })
      } else {
        const principal = new CurrencyBalance(
          price.mul(new BN(quantity.toDecimal().toString())),
          pool.currency.decimals
        )
        const repay = { principal, interest: new BN(0), unscheduled: new BN(0) }
        const borrow = {
          quantity,
          price,
          interest: new BN(0),
          unscheduled: new BN(0),
        }
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
      const price = CurrencyBalance.fromFloat(values.price.toString(), pool.currency.decimals)
      const quantity = Price.fromFloat(values.quantity)
      doFinanceTransaction([loan.poolId, loan.id, quantity, price], {
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

  return (
    <>
      {
        <FormikProvider value={financeForm}>
          <Stack as={Form} gap={2} noValidate ref={financeFormRef}>
            <Shelf gap={1}>
              <Field name="quantity" validate={combine(required(), positiveNumber())}>
                {({ field, form }: FieldProps) => {
                  return (
                    <CurrencyInput
                      {...field}
                      label="Quantity"
                      placeholder="0"
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
                      ? `Amount exceeds available (${formatBalance(maxAvailable, displayCurrency, 2)})`
                      : ''
                  },
                  maxPriceVariance(loan.pricing)
                )}
              >
                {({ field, form }: FieldProps) => {
                  return (
                    <CurrencyInput
                      {...field}
                      label="Settlement price"
                      currency={displayCurrency}
                      onChange={(value) => form.setFieldValue('price', value)}
                      decimals={8}
                    />
                  )
                }}
              </Field>
            </Shelf>
            {source === 'reserve' && withdraw.render()}

            {poolFees.render()}

            {totalFinance.gt(0) && totalFinance.gt(maxAvailable) && (
              <Box bg="statusCriticalBg" p={1}>
                <InlineFeedback status="critical">
                  <Text color="statusCritical">
                    Available financing ({formatBalance(maxAvailable, displayCurrency, 2)}) is smaller than the total
                    principal ({formatBalance(totalFinance, displayCurrency, 2)}).
                  </Text>
                </InlineFeedback>
              </Box>
            )}

            <Stack p={2} maxWidth="444px" bg="backgroundTertiary" gap={2}>
              <Shelf justifyContent="space-between">
                <Text variant="label2" color="textPrimary">
                  Available balance
                </Text>
                <Text variant="label2">
                  <Tooltip body={'Balance of the source asset'} style={{ pointerEvents: 'auto' }}>
                    {formatBalance(maxAvailable, displayCurrency, 2)}
                  </Tooltip>
                </Text>
              </Shelf>

              <Stack gap={1}>
                <Shelf justifyContent="space-between">
                  <Text variant="label2" color="textPrimary">
                    Purchase amount
                  </Text>
                  <Text variant="label2">{formatBalance(totalFinance, displayCurrency, 2)}</Text>
                </Shelf>
              </Stack>

              {poolFees.renderSummary()}
            </Stack>

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

            <Stack>
              <Button
                type="submit"
                loading={isFinanceLoading}
                disabled={
                  !withdraw.isValid || !poolFees.isValid(financeForm) || !financeForm.isValid || maxAvailable.eq(0)
                }
              >
                Purchase
              </Button>
            </Stack>
          </Stack>
        </FormikProvider>
      }
    </>
  )
}
