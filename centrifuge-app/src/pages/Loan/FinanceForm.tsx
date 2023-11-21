import {
  ActiveLoan,
  CurrencyBalance,
  ExternalLoan,
  findBalance,
  Loan as LoanType,
  WithdrawAddress,
} from '@centrifuge/centrifuge-js'
import {
  CombinedSubstrateAccount,
  truncateAddress,
  useBalances,
  useCentrifugeTransaction,
  useCentrifugeUtils,
  useGetNetworkName,
} from '@centrifuge/centrifuge-react'
import { Button, Card, CurrencyInput, InlineFeedback, Select, Shelf, Stack, Text } from '@centrifuge/fabric'
import BN from 'bn.js'
import Decimal from 'decimal.js-light'
import { Field, FieldProps, Form, FormikProvider, useField, useFormik, useFormikContext } from 'formik'
import * as React from 'react'
import { parachainNames } from '../../config'
import { Dec } from '../../utils/Decimal'
import { formatBalance, roundDown } from '../../utils/formatting'
import { useFocusInvalidInput } from '../../utils/useFocusInvalidInput'
import { useAvailableFinancing } from '../../utils/useLoans'
import { useBorrower, usePoolAccess } from '../../utils/usePermissions'
import { usePool } from '../../utils/usePools'
import { combine, max, positiveNumber } from '../../utils/validation'
import { ExternalFinanceForm } from './ExternalFinanceForm'

type FinanceValues = {
  amount: number | '' | Decimal
  withdraw: undefined | WithdrawAddress
}

type RepayValues = {
  amount: number | '' | Decimal
}

export function FinanceForm({ loan }: { loan: LoanType }) {
  const isExternalAsset = 'valuationMethod' in loan.pricing && loan.pricing.valuationMethod === 'oracle'
  return isExternalAsset ? <ExternalFinanceForm loan={loan as ExternalLoan} /> : <InternalFinanceForm loan={loan} />
}

function InternalFinanceForm({ loan }: { loan: LoanType }) {
  const pool = usePool(loan.poolId)
  const account = useBorrower(loan.poolId, loan.id)
  if (!account) throw new Error('No borrower')
  const balances = useBalances(account.actingAddress)
  const balance = (balances && findBalance(balances.currencies, pool.currency.key)?.balance.toDecimal()) || Dec(0)
  const { current: availableFinancing, debtWithMargin } = useAvailableFinancing(loan.poolId, loan.id)
  const { execute: doFinanceTransaction, isLoading: isFinanceLoading } = useCentrifugeTransaction(
    'Finance asset',
    (cent) => cent.pools.financeLoan,
    {
      onSuccess: () => {
        financeForm.resetForm()
      },
    }
  )

  const { execute: doRepayTransaction, isLoading: isRepayLoading } = useCentrifugeTransaction(
    'Repay asset',
    (cent) => cent.pools.repayLoanPartially,
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
    const l = loan as ActiveLoan
    doRepayAllTransaction([loan.poolId, loan.id, l.totalBorrowed.sub(l.repaid.principal)], {
      account,
      forceProxyType: 'Borrow',
    })
  }

  const financeForm = useFormik<FinanceValues>({
    initialValues: {
      amount: '',
      withdraw: undefined,
    },
    onSubmit: (values, actions) => {
      const amount = CurrencyBalance.fromFloat(values.amount, pool.currency.decimals)
      doFinanceTransaction(
        [
          loan.poolId,
          loan.id,
          amount,
          values.withdraw ? { ...values.withdraw, currency: pool.currency.key } : undefined,
        ],
        { account, forceProxyType: 'Borrow' }
      )
      actions.setSubmitting(false)
    },
    validateOnMount: true,
  })

  const repayForm = useFormik<RepayValues>({
    initialValues: {
      amount: '',
    },
    onSubmit: (values, actions) => {
      const l = loan as ActiveLoan
      const outstandingPrincipal = l.totalBorrowed.sub(l.repaid.principal)
      let amount: BN = CurrencyBalance.fromFloat(values.amount, pool.currency.decimals)
      let interest = new BN(0)
      if (amount.gt(outstandingPrincipal)) {
        interest = amount.sub(outstandingPrincipal)
        amount = outstandingPrincipal
      }
      doRepayTransaction([l.poolId, l.id, amount, interest, new BN(0)], { account, forceProxyType: 'Borrow' })
      actions.setSubmitting(false)
    },
    validateOnMount: true,
  })

  const financeFormRef = React.useRef<HTMLFormElement>(null)
  useFocusInvalidInput(financeForm, financeFormRef)

  const repayFormRef = React.useRef<HTMLFormElement>(null)
  useFocusInvalidInput(repayForm, repayFormRef)

  if (loan.status === 'Closed') {
    return null
  }

  const debt = loan.outstandingDebt?.toDecimal() || Dec(0)
  const poolReserve = pool?.reserve.available.toDecimal() ?? Dec(0)
  const maxBorrow = poolReserve.lessThan(availableFinancing) ? poolReserve : availableFinancing
  const maxRepay = balance.lessThan(loan.outstandingDebt.toDecimal()) ? balance : loan.outstandingDebt.toDecimal()
  const canRepayAll = debtWithMargin?.lte(balance)
  const maturityDatePassed =
    loan?.pricing && 'maturityDate' in loan.pricing && new Date() > new Date(loan.pricing.maturityDate)

  return (
    <Stack gap={3}>
      <Stack as={Card} gap={2} p={2}>
        <Stack>
          {'valuationMethod' in loan.pricing && (
            <Shelf justifyContent="space-between">
              <Text variant="heading3">Available financing</Text>
              {/* availableFinancing needs to be rounded down, b/c onSetMax displays the rounded down value as well */}
              <Text variant="heading3">{formatBalance(roundDown(availableFinancing), pool?.currency.symbol, 2)}</Text>
            </Shelf>
          )}
          <Shelf justifyContent="space-between">
            <Text variant="label1">Total financed</Text>
            <Text variant="label1">
              {formatBalance(loan.totalBorrowed?.toDecimal() ?? 0, pool?.currency.symbol, 2)}
            </Text>
          </Shelf>
        </Stack>
        {availableFinancing.greaterThan(0) && !maturityDatePassed && (
          <FormikProvider value={financeForm}>
            <Stack as={Form} gap={2} noValidate ref={financeFormRef}>
              <Field
                name="amount"
                validate={combine(
                  positiveNumber(),
                  max(availableFinancing.toNumber(), 'Amount exceeds available financing'),
                  max(
                    maxBorrow.toNumber(),
                    `Amount exceeds available reserve (${formatBalance(maxBorrow, pool?.currency.symbol, 2)})`
                  )
                )}
              >
                {({ field, meta, form }: FieldProps) => {
                  return (
                    <CurrencyInput
                      {...field}
                      value={field.value instanceof Decimal ? field.value.toNumber() : field.value}
                      label="Amount"
                      errorMessage={meta.touched ? meta.error : undefined}
                      secondaryLabel={`${formatBalance(roundDown(maxBorrow), pool?.currency.symbol, 2)} available`}
                      disabled={isFinanceLoading}
                      currency={pool?.currency.symbol}
                      onChange={(value: number) => form.setFieldValue('amount', value)}
                      onSetMax={() => form.setFieldValue('amount', maxBorrow)}
                    />
                  )
                }}
              </Field>
              <WithdrawSelect loan={loan} borrower={account} />
              {poolReserve.lessThan(availableFinancing) && (
                <InlineFeedback>
                  The pool&apos;s available reserve ({formatBalance(poolReserve, pool?.currency.symbol)}) is smaller
                  than the available financing
                </InlineFeedback>
              )}
              <Stack px={1}>
                <Button type="submit" loading={isFinanceLoading}>
                  Finance asset
                </Button>
              </Stack>
            </Stack>
          </FormikProvider>
        )}
      </Stack>

      <Stack as={Card} gap={2} p={2}>
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

        {loan.status !== 'Created' &&
          (debt.gt(0) ? (
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
                {balance.lessThan(debt) && (
                  <InlineFeedback>
                    Your wallet balance ({formatBalance(roundDown(balance), pool?.currency.symbol, 2)}) is smaller than
                    the outstanding balance.
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
          ))}
      </Stack>
    </Stack>
  )
}

export function WithdrawSelect({ loan, borrower }: { loan: LoanType; borrower: CombinedSubstrateAccount }) {
  const form = useFormikContext<Pick<FinanceValues, 'withdraw'>>()
  const access = usePoolAccess(loan.poolId)
  const ao = access.assetOriginators.find((a) => a.address === borrower.actingAddress)!
  const utils = useCentrifugeUtils()
  const getName = useGetNetworkName()
  const [field, meta, helpers] = useField('withdraw')

  const options = (ao.transferAllowlist.filter((l) => !!l.meta && !!l.key) as { meta: WithdrawAddress }[]).map(
    ({ meta: { address, location }, meta }) => ({
      label: `${truncateAddress(utils.formatAddress(address))} on ${
        typeof location === 'string'
          ? getName(location as any)
          : 'parachain' in location
          ? parachainNames[location.parachain]
          : getName(location.evm)
      }`,
      value: JSON.stringify(meta),
    })
  )

  React.useEffect(() => {
    if (!ao.transferAllowlist.length) return
    helpers.setValue(ao.transferAllowlist[0].meta, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!ao.transferAllowlist.length) return null

  return (
    <Select
      name="withdraw"
      label="Withdraw address"
      onChange={(event) => helpers.setValue(JSON.parse(event.target.value))}
      onBlur={field.onBlur}
      errorMessage={(meta.touched || form.submitCount > 0) && meta.error ? meta.error : undefined}
      value={field.value ? JSON.stringify(field.value) : ''}
      options={options}
      disabled={ao.transferAllowlist.length === 1}
    />
  )
}
