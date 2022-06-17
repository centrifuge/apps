import { Balance, Loan as LoanType } from '@centrifuge/centrifuge-js'
import { Button, Card, CurrencyInput, IconInfo, Shelf, Stack, Text } from '@centrifuge/fabric'
import Decimal from 'decimal.js-light'
import { Field, FieldProps, Form, FormikProvider, useFormik } from 'formik'
import * as React from 'react'
import { Dec } from '../../utils/Decimal'
import { formatBalance, getCurrencySymbol } from '../../utils/formatting'
import { useAddress } from '../../utils/useAddress'
import { getBalanceDec, useBalances } from '../../utils/useBalances'
import { useCentrifugeTransaction } from '../../utils/useCentrifugeTransaction'
import { useFocusInvalidInput } from '../../utils/useFocusInvalidInput'
import { useAvailableFinancing } from '../../utils/useLoans'
import { usePool } from '../../utils/usePools'
import { combine, max, positiveNumber } from '../../utils/validation'

type FinanceValues = {
  amount: string | Decimal
}

type RepayValues = {
  amount: string | Decimal
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
  const maxRepay = Math.min(balance.toNumber(), loan.outstandingDebt.toDecimal().toNumber())
  const canRepayAll = debtWithMargin.lte(balance)

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
            <Text variant="heading3">{formatBalance(availableFinancing, pool?.currency)}</Text>
          </Shelf>
          <Shelf justifyContent="space-between">
            <Text variant="label1">Total financed</Text>
            <Text variant="label1">{formatBalance(loan.totalBorrowed, pool?.currency)}</Text>
          </Shelf>
        </Stack>
        {loan.status === 'Active' && loan.totalBorrowed.toDecimal().lt(initialCeiling) && (
          <FormikProvider value={financeForm}>
            <Stack as={Form} gap={2} noValidate ref={financeFormRef}>
              <Field
                name="amount"
                validate={combine(
                  positiveNumber(),
                  max(availableFinancing.toNumber(), 'Amount exceeds available financing'),
                  max(
                    maxBorrow.toNumber(),
                    `Amount exceeds available reserve (${formatBalance(maxBorrow, pool?.currency)})`
                  )
                )}
              >
                {({ field: { value, ...fieldProps }, meta, form }: FieldProps) => (
                  <CurrencyInput
                    {...fieldProps}
                    label="Amount"
                    errorMessage={meta.touched ? meta.error : undefined}
                    secondaryLabel={`${formatBalance(maxBorrow, pool?.currency)} available`}
                    disabled={isFinanceLoading}
                    currency={getCurrencySymbol(pool?.currency)}
                    handleChange={(value: number) => form.setFieldValue('amount', value)}
                    onSetMax={(setDisplayValue) => {
                      setDisplayValue(Math.floor(maxBorrow.toNumber() * 100) / 100)
                      form.setFieldValue('amount', Math.floor(maxRepay * 100) / 100)
                    }}
                  />
                )}
              </Field>
              {poolReserve.lessThan(availableFinancing) && (
                <Shelf alignItems="flex-start" gap="4px">
                  <IconInfo height="16" />
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
            <Text variant="heading3">{formatBalance(loan.outstandingDebt, pool?.currency)}</Text>
          </Shelf>
          <Shelf justifyContent="space-between">
            <Text variant="label1">Total repaid</Text>
            <Text variant="label1">{formatBalance(loan.totalRepaid, pool?.currency)}</Text>
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
                {({ field: { value, ...fieldProps }, meta, form }: FieldProps) => {
                  return (
                    <CurrencyInput
                      {...fieldProps}
                      label="Amount"
                      errorMessage={meta.touched ? meta.error : undefined}
                      secondaryLabel={`${formatBalance(maxRepay, pool?.currency)} available`}
                      disabled={isRepayLoading || isRepayAllLoading}
                      currency={getCurrencySymbol(pool?.currency)}
                      handleChange={(value) => form.setFieldValue('amount', value)}
                      onSetMax={(setDisplayValue) => {
                        setDisplayValue(Math.floor(maxRepay * 100) / 100)
                        form.setFieldValue('amount', Math.floor(maxRepay * 100) / 100)
                      }}
                    />
                  )
                }}
              </Field>
              {balance.lessThan(loan.outstandingDebt.toDecimal()) && (
                <Shelf alignItems="flex-start" gap="4px">
                  <IconInfo height="16" />
                  <Text variant="body3">
                    Your wallet balance ({formatBalance(balance, pool?.currency)}) is smaller than the outstanding
                    balance.
                  </Text>
                </Shelf>
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
