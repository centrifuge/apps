import { ActiveLoan, CurrencyBalance, findBalance } from '@centrifuge/centrifuge-js'
import { useBalances, useCentrifugeTransaction } from '@centrifuge/centrifuge-react'
import { Button, Card, CurrencyInput, InlineFeedback, Shelf, Stack, Text } from '@centrifuge/fabric'
import Decimal from 'decimal.js-light'
import { Field, FieldProps, Form, FormikProvider, useFormik } from 'formik'
import * as React from 'react'
import { combineLatest, switchMap } from 'rxjs'
import { Dec } from '../../utils/Decimal'
import { formatBalance, roundDown } from '../../utils/formatting'
import { useFocusInvalidInput } from '../../utils/useFocusInvalidInput'
import { useAvailableFinancing } from '../../utils/useLoans'
import { useBorrower } from '../../utils/usePermissions'
import { usePool, usePoolMetadata } from '../../utils/usePools'
import { combine, max, positiveNumber } from '../../utils/validation'
import { useChargePoolFees } from './ChargeFeesFields'
import { ExternalRepayForm } from './ExternalRepayForm'
import { SourceSelect } from './SourceSelect'
import { TransferDebtForm } from './TransferDebtForm'
import { isExternalLoan } from './utils'

export type RepayValues = {
  amount: number | '' | Decimal
  amountAdditional: number | '' | Decimal
  interest: number | '' | Decimal
  fees: { id: string; amount: number | '' | Decimal }[]
}

export function RepayForm({ loan }: { loan: ActiveLoan }) {
  const [source, setSource] = React.useState<string>('reserve')
  const pool = usePool(loan.poolId)
  const { data: poolMetadata } = usePoolMetadata(pool)

  const title = poolMetadata?.pool?.asset.class === 'Private credit' ? 'Repay' : 'Sell'

  return (
    <Stack gap={2}>
      <Stack as={Card} gap={2} p={2}>
        <Text variant="heading2">{title}</Text>
        <SourceSelect loan={loan} value={source} onChange={(newSource) => setSource(newSource)} type="repay" />
        {source === 'reserve' && isExternalLoan(loan) ? (
          <ExternalRepayForm loan={loan} />
        ) : source === 'reserve' && !isExternalLoan(loan) ? (
          <InternalRepayForm loan={loan} />
        ) : (
          <TransferDebtForm loan={loan} source={source} />
        )}
      </Stack>
    </Stack>
  )
}

function InternalRepayForm({ loan }: { loan: ActiveLoan }) {
  const pool = usePool(loan.poolId)
  const account = useBorrower(loan.poolId, loan.id)
  const balances = useBalances(account?.actingAddress)
  const balance = (balances && findBalance(balances.currencies, pool.currency.key)?.balance.toDecimal()) || Dec(0)
  const { debtWithMargin } = useAvailableFinancing(loan.poolId, loan.id)
  const poolFees = useChargePoolFees(loan.poolId, loan.id)

  const { execute: doRepayTransaction, isLoading: isRepayLoading } = useCentrifugeTransaction(
    'Repay asset',
    (cent) =>
      (
        args: [
          loanId: string,
          poolId: string,
          amount: CurrencyBalance,
          interest: CurrencyBalance,
          additionalAmount: CurrencyBalance
        ],
        options
      ) => {
        const [loanId, poolId, amount, interest, additionalAmount] = args
        return combineLatest([
          cent.getApi(),
          cent.pools.repayLoanPartially([loanId, poolId, amount, interest, additionalAmount], { batch: true }),
          poolFees.getBatch(repayForm),
        ]).pipe(
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

  const { execute: doRepayAllTransaction, isLoading: isRepayAllLoading } = useCentrifugeTransaction(
    'Repay asset',
    (cent) => cent.pools.repayAndCloseLoan
  )

  const { execute: doCloseTransaction, isLoading: isCloseLoading } = useCentrifugeTransaction(
    'Close asset',
    (cent) => cent.pools.closeLoan
  )

  function repayAll() {
    doRepayAllTransaction([loan.poolId, loan.id, loan.totalBorrowed.sub(loan.repaid.principal)], {
      account,
      forceProxyType: 'Borrow',
    })
  }

  const repayForm = useFormik<RepayValues>({
    initialValues: {
      amount: '',
      amountAdditional: '',
      interest: '',
      fees: [],
    },
    onSubmit: (values, actions) => {
      let interest = CurrencyBalance.fromFloat(values.interest || 0, pool.currency.decimals)
      let additionalAmount = CurrencyBalance.fromFloat(values.amountAdditional, pool.currency.decimals)
      let amount = CurrencyBalance.fromFloat(values.amount, pool.currency.decimals)

      doRepayTransaction([loan.poolId, loan.id, amount, interest, additionalAmount], {
        account,
        forceProxyType: 'Borrow',
      })
      actions.setSubmitting(false)
    },
    validateOnMount: true,
  })

  const repayFormRef = React.useRef<HTMLFormElement>(null)
  useFocusInvalidInput(repayForm, repayFormRef)

  const debt = loan.outstandingDebt?.toDecimal() || Dec(0)
  const maxRepay = (
    balance.lessThan(loan.outstandingDebt.toDecimal()) ? balance : loan.outstandingDebt.toDecimal()
  ).sub(repayForm.values.fees.reduce((acc, fee) => acc.add(fee?.amount || 0), Dec(0)).toString())
  const canRepayAll = debtWithMargin?.lte(balance)

  return (
    <>
      <Stack>
        <Shelf justifyContent="space-between">
          <Text variant="heading3">Outstanding</Text>
          {/* outstandingDebt needs to be rounded down, b/c onSetMax displays the rounded down value as well */}
          <Text variant="heading3">{formatBalance(roundDown(debt), pool?.currency.symbol, 2)}</Text>
        </Shelf>
        <Shelf justifyContent="space-between">
          <Text variant="label1">Total repaid</Text>
          <Text variant="label1">{formatBalance(loan?.totalRepaid || 0, pool?.currency.symbol, 2)}</Text>
        </Shelf>
      </Stack>

      {debt.gt(0) ? (
        <FormikProvider value={repayForm}>
          <Stack as={Form} gap={2} noValidate ref={repayFormRef}>
            <Field
              validate={combine(
                positiveNumber(),
                max(balance.toNumber(), 'Amount exceeds balance'),
                max(debt.toNumber(), 'Amount exceeds outstanding')
              )}
              name="amount"
            >
              {({ field, meta, form }: FieldProps) => {
                return (
                  <CurrencyInput
                    {...field}
                    value={field.value instanceof Decimal ? field.value.toNumber() : field.value}
                    label="Amount"
                    errorMessage={meta.touched ? meta.error : undefined}
                    secondaryLabel={`${formatBalance(roundDown(maxRepay), pool?.currency.symbol, 2)} available`}
                    disabled={isRepayLoading || isRepayAllLoading}
                    currency={pool?.currency.symbol}
                    onChange={(value) => form.setFieldValue('amount', value)}
                    onSetMax={() => form.setFieldValue('amount', maxRepay)}
                  />
                )
              }}
            </Field>
            {loan.outstandingInterest.toDecimal().gt(0) && (
              <Field validate={combine(positiveNumber())} name="interest">
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
                      disabled={isRepayLoading || isRepayAllLoading}
                      currency={pool?.currency.symbol}
                      onChange={(value) => form.setFieldValue('interest', value)}
                      onSetMax={() => form.setFieldValue('interest', loan.outstandingInterest.toDecimal())}
                    />
                  )
                }}
              </Field>
            )}
            <Field name="amountAdditional">
              {({ field, meta, form }: FieldProps) => {
                return (
                  <CurrencyInput
                    {...field}
                    value={field.value instanceof Decimal ? field.value.toNumber() : field.value}
                    label="Additional amount"
                    errorMessage={meta.touched ? meta.error : undefined}
                    disabled={isRepayLoading || isRepayAllLoading}
                    currency={pool?.currency.symbol}
                    onChange={(value) => form.setFieldValue('amountAdditional', value)}
                  />
                )
              }}
            </Field>
            {poolFees.render()}
            {balance.lessThan(debt) && (
              <InlineFeedback>
                Your wallet balance ({formatBalance(roundDown(balance), pool?.currency.symbol, 2)}) is smaller than the
                outstanding balance.
              </InlineFeedback>
            )}
            <Stack gap={1} px={1}>
              <Button type="submit" disabled={isRepayAllLoading} loading={isRepayLoading}>
                Repay asset
              </Button>
              <Button
                variant="secondary"
                loading={isRepayAllLoading}
                disabled={!canRepayAll || isRepayLoading}
                onClick={() => repayAll()}
              >
                Repay all and close
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
      )}
    </>
  )
}
