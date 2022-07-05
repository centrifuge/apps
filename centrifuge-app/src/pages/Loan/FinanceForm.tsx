import { Balance, Loan as LoanType } from '@centrifuge/centrifuge-js'
import { LoanInfo } from '@centrifuge/centrifuge-js/dist/modules/pools'
import { Button, Card, CurrencyInput, IconInfo, InlineFeedback, Shelf, Stack, Text } from '@centrifuge/fabric'
import Decimal from 'decimal.js-light'
import { Field, FieldProps, Form, FormikProvider, useFormik } from 'formik'
import * as React from 'react'
import { daysBetween } from '../../utils/date'
import { Dec } from '../../utils/Decimal'
import { formatBalance, getCurrencySymbol, roundDown } from '../../utils/formatting'
import { useAddress } from '../../utils/useAddress'
import { getBalanceDec, useBalances } from '../../utils/useBalances'
import { useCentrifugeTransaction } from '../../utils/useCentrifugeTransaction'
import { useFocusInvalidInput } from '../../utils/useFocusInvalidInput'
import { useAvailableFinancing } from '../../utils/useLoans'
import { usePool } from '../../utils/usePools'
import { combine, max, positiveNumber } from '../../utils/validation'

type FinanceValues = {
  amount: number | '' | Decimal
}

type RepayValues = {
  amount: number | '' | Decimal
}

const SEC_PER_DAY = 24 * 60 * 60

export const FinanceForm: React.VFC<{ loan: LoanType }> = ({ loan }) => {
  const pool = usePool(loan.poolId)
  const address = useAddress()
  const balances = useBalances(address)
  const balance = balances && pool ? getBalanceDec(balances, pool.currency) : Dec(0)
  const { current: availableFinancing, initial: initialCeiling } = useAvailableFinancing(loan.poolId, loan.id)
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

  function repayAll() {
    doRepayAllTransaction([loan.poolId, loan.id])
  }

  const debt = loan.outstandingDebt.toDecimal()
  const debtWithMargin = debt.add(
    loan.principalDebt.toDecimal().mul(loan.interestRatePerSec.toDecimal().minus(1).mul(SEC_PER_DAY))
  )
  const poolReserve = pool?.reserve.available.toDecimal() ?? Dec(0)
  const maxBorrow = poolReserve.lessThan(availableFinancing) ? poolReserve : availableFinancing
  const maxRepay = balance.lessThan(loan.outstandingDebt.toDecimal()) ? balance : loan.outstandingDebt.toDecimal()
  const canRepayAll = debtWithMargin.lte(balance)

  const allowedToBorrow: Record<LoanInfo['type'], boolean> = {
    CreditLineWithMaturity:
      'maturityDate' in loan.loanInfo &&
      Dec(daysBetween(loan.originationDate, loan.loanInfo.maturityDate)).gt(0) &&
      availableFinancing.greaterThan(0),
    BulletLoan:
      'maturityDate' in loan.loanInfo &&
      Dec(daysBetween(loan.originationDate, loan.loanInfo.maturityDate)).gt(0) &&
      loan.totalBorrowed.toDecimal().lt(initialCeiling),
    CreditLine: loan.outstandingDebt.toDecimal().lt(initialCeiling),
  }

  const financeForm = useFormik<FinanceValues>({
    initialValues: {
      amount: '',
    },
    onSubmit: (values, actions) => {
      const amount = Balance.fromFloat(values.amount)
      doFinanceTransaction([loan.poolId, loan.id, amount])
      actions.setSubmitting(false)
    },
    validateOnMount: true,
  })

  const repayForm = useFormik<RepayValues>({
    initialValues: {
      amount: '',
    },
    onSubmit: (values, actions) => {
      const amount = Balance.fromFloat(values.amount)
      doRepayTransaction([loan.poolId, loan.id, amount])
      actions.setSubmitting(false)
    },
    validateOnMount: true,
  })

  const financeFormRef = React.useRef<HTMLFormElement>(null)
  useFocusInvalidInput(financeForm, financeFormRef)

  const repayFormRef = React.useRef<HTMLFormElement>(null)
  useFocusInvalidInput(repayForm, repayFormRef)

  return (
    <Stack gap={3}>
      <Stack as={Card} gap={2} p={2}>
        <Stack>
          <Shelf justifyContent="space-between">
            <Text variant="heading3">Available financing</Text>
            {/* availableFinancing needs to be rounded down, b/c onSetMax displays the rounded down value as well */}
            <Text variant="heading3">
              {formatBalance(roundDown(loan.status === 'Closed' ? 0 : availableFinancing), pool?.currency, 2)}
            </Text>
          </Shelf>
          <Shelf justifyContent="space-between">
            <Text variant="label1">Total financed</Text>
            <Text variant="label1">{formatBalance(loan.totalBorrowed.toDecimal(), pool?.currency, 2)}</Text>
          </Shelf>
        </Stack>
        {loan.status === 'Active' && allowedToBorrow[loan.loanInfo.type] && (
          <FormikProvider value={financeForm}>
            <Stack as={Form} gap={2} noValidate ref={financeFormRef}>
              <Field
                name="amount"
                validate={combine(
                  positiveNumber(),
                  max(availableFinancing.toNumber(), 'Amount exceeds available financing'),
                  max(
                    maxBorrow.toNumber(),
                    `Amount exceeds available reserve (${formatBalance(maxBorrow, pool?.currency, 2)})`
                  )
                )}
              >
                {({ field, meta, form }: FieldProps) => (
                  <CurrencyInput
                    {...field}
                    label="Amount"
                    errorMessage={meta.touched ? meta.error : undefined}
                    secondaryLabel={`${formatBalance(roundDown(maxBorrow), pool?.currency, 2)} available`}
                    disabled={isFinanceLoading}
                    currency={getCurrencySymbol(pool?.currency)}
                    onChange={(value: number) => form.setFieldValue('amount', value)}
                    onSetMax={() => form.setFieldValue('amount', maxBorrow)}
                  />
                )}
              </Field>
              {poolReserve.lessThan(availableFinancing) && (
                <Shelf alignItems="flex-start" justifyContent="start" gap="4px">
                  <IconInfo size="iconMedium" />
                  <Text variant="body3">
                    The pool&apos;s available reserve ({formatBalance(poolReserve, pool?.currency)}) is smaller than the
                    available financing
                  </Text>
                </Shelf>
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
            <Text variant="heading3">
              {formatBalance(roundDown(loan.outstandingDebt.toDecimal()), pool?.currency, 2)}
            </Text>
          </Shelf>
          <Shelf justifyContent="space-between">
            <Text variant="label1">Total repaid</Text>
            <Text variant="label1">{formatBalance(loan.totalRepaid, pool?.currency, 2)}</Text>
          </Shelf>
        </Stack>

        {loan.status === 'Active' && !loan.outstandingDebt.isZero() && (
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
                      label="Amount"
                      errorMessage={meta.touched ? meta.error : undefined}
                      secondaryLabel={`${formatBalance(roundDown(maxRepay), pool?.currency, 2)} available`}
                      disabled={isRepayLoading || isRepayAllLoading}
                      currency={getCurrencySymbol(pool?.currency)}
                      onChange={(value) => form.setFieldValue('amount', value)}
                      onSetMax={() => form.setFieldValue('amount', maxRepay)}
                    />
                  )
                }}
              </Field>
              {balance.lessThan(loan.outstandingDebt.toDecimal()) && (
                <InlineFeedback>
                  Your wallet balance ({formatBalance(roundDown(balance), pool?.currency, 2)}) is smaller than the
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
        )}
      </Stack>
    </Stack>
  )
}
