import { ActiveLoan, CreatedLoan, CurrencyBalance, ExternalLoan, findBalance } from '@centrifuge/centrifuge-js'
import { useBalances, useCentrifugeTransaction } from '@centrifuge/centrifuge-react'
import { Button, CurrencyInput, InlineFeedback, Shelf, Stack, Text } from '@centrifuge/fabric'
import Decimal from 'decimal.js-light'
import { Field, FieldProps, Form, FormikProvider, useFormik } from 'formik'
import * as React from 'react'
import { combineLatest, switchMap } from 'rxjs'
import { Dec } from '../../utils/Decimal'
import { formatBalance, roundDown } from '../../utils/formatting'
import { useFocusInvalidInput } from '../../utils/useFocusInvalidInput'
import { useAvailableFinancing, useLoans } from '../../utils/useLoans'
import { useBorrower } from '../../utils/usePermissions'
import { usePool, usePoolMetadata } from '../../utils/usePools'
import { combine, max, positiveNumber } from '../../utils/validation'
import { useChargePoolFees } from './ChargeFeesFields'
import { ExternalRepayForm } from './ExternalRepayForm'
import { SourceSelect } from './SourceSelect'
import { isExternalLoan } from './utils'

export type RepayValues = {
  principal: number | '' | Decimal
  amountAdditional: number | '' | Decimal
  interest: number | '' | Decimal
  fees: { id: string; amount: number | '' | Decimal }[]
}

export function RepayForm({ loan }: { loan: ActiveLoan }) {
  const [destination, setDestination] = React.useState<string>('reserve')

  return (
    <Stack gap={2} p={1}>
      <Text variant="heading2">{isExternalLoan(loan) ? 'Sell' : 'Repay'}</Text>
      <SourceSelect loan={loan} value={destination} onChange={(newSource) => setDestination(newSource)} type="repay" />
      {isExternalLoan(loan) ? (
        <ExternalRepayForm loan={loan as ExternalLoan} destination={destination} />
      ) : (
        <InternalRepayForm loan={loan} destination={destination} />
      )}
    </Stack>
  )
}

function InternalRepayForm({ loan, destination }: { loan: ActiveLoan; destination: string }) {
  const pool = usePool(loan.poolId)
  const account = useBorrower(loan.poolId, loan.id)
  const balances = useBalances(account?.actingAddress)
  const balance = (balances && findBalance(balances.currencies, pool.currency.key)?.balance.toDecimal()) || Dec(0)
  const { debtWithMargin } = useAvailableFinancing(loan.poolId, loan.id)
  const poolFees = useChargePoolFees(loan.poolId, loan.id)
  const loans = useLoans(loan.poolId)
  const { data: poolMetadata } = usePoolMetadata(pool)

  const { execute: doRepayTransaction, isLoading: isRepayLoading } = useCentrifugeTransaction(
    'Repay asset',
    (cent) =>
      (
        args: [
          loanId: string,
          poolId: string,
          principal: CurrencyBalance,
          interest: CurrencyBalance,
          amountAdditional: CurrencyBalance
        ],
        options
      ) => {
        const [loanId, poolId, principal, interest, amountAdditional] = args
        let repayTx
        if (destination === 'reserve') {
          repayTx = cent.pools.repayLoanPartially([loanId, poolId, principal, interest, amountAdditional], {
            batch: true,
          })
        } else {
          const toLoan = loans?.find((l) => l.id === destination) as CreatedLoan | ActiveLoan
          if (!toLoan) throw new Error('toLoan not found')
          const repay = { principal, interest }
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
      principal: '',
      amountAdditional: '',
      interest: '',
      fees: [],
    },
    onSubmit: (values, actions) => {
      const interest = CurrencyBalance.fromFloat(values.interest || 0, pool.currency.decimals)
      const additionalAmount = CurrencyBalance.fromFloat(values.amountAdditional, pool.currency.decimals)
      const principal = CurrencyBalance.fromFloat(values.principal, pool.currency.decimals)

      doRepayTransaction([loan.poolId, loan.id, principal, interest, additionalAmount], {
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
  const maxRepay = balance.lessThan(loan.outstandingDebt.toDecimal()) ? balance : loan.outstandingDebt.toDecimal()
  const canRepayAll = debtWithMargin?.lte(balance)
  const totalRepay = Dec(repayForm.values.principal || 0)
    .add(Dec(repayForm.values.interest || 0))
    .add(Dec(repayForm.values.amountAdditional || 0))

  return (
    <>
      {debt.gt(0) ? (
        <FormikProvider value={repayForm}>
          <Stack as={Form} gap={2} noValidate ref={repayFormRef}>
            <Field
              validate={combine(
                positiveNumber(),
                max(balance.toNumber(), 'Principal exceeds balance'),
                max(debt.toNumber(), 'Principal exceeds outstanding')
              )}
              name="principal"
            >
              {({ field, meta, form }: FieldProps) => {
                return (
                  <CurrencyInput
                    {...field}
                    value={field.value instanceof Decimal ? field.value.toNumber() : field.value}
                    label="Principal"
                    errorMessage={meta.touched ? meta.error : undefined}
                    secondaryLabel={`${formatBalance(roundDown(maxRepay), pool?.currency.symbol, 2)} available`}
                    disabled={isRepayLoading || isRepayAllLoading}
                    currency={pool?.currency.symbol}
                    onChange={(value) => form.setFieldValue('principal', value)}
                    onSetMax={() => form.setFieldValue('principal', maxRepay)}
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
            {destination === 'reserve' ? (
              <InlineFeedback>
                Stable-coins will be transferred to the specified withdrawal addresses, on the specified networks.
                Expect a delay until the transfer is complete.
              </InlineFeedback>
            ) : (
              <InlineFeedback>
                Virtual accounting process. No onchain stable-coin transfers are expected.
              </InlineFeedback>
            )}
            {balance.lessThan(debt) && (
              <InlineFeedback>
                Your wallet balance ({formatBalance(roundDown(balance), pool?.currency.symbol, 2)}) is smaller than the
                outstanding balance.
              </InlineFeedback>
            )}
            <Stack gap={1}>
              <Shelf justifyContent="space-between">
                <Text variant="emphasized">Total amount</Text>
                <Text variant="emphasized">{formatBalance(totalRepay, pool?.currency.symbol, 2)}</Text>
              </Shelf>

              {poolFees.renderSummary()}
            </Stack>
            <Stack gap={1} px={1}>
              <Button
                type="submit"
                disabled={
                  isRepayAllLoading ||
                  !poolFees.isValid(repayForm) ||
                  !repayForm.values.principal ||
                  !repayForm.values.interest
                }
                loading={isRepayLoading}
              >
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
