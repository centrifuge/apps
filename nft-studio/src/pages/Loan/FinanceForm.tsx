import { Balance, Loan as LoanType } from '@centrifuge/centrifuge-js'
import { Button, Card, CurrencyInput, Shelf, Stack, Text } from '@centrifuge/fabric'
import Decimal from 'decimal.js-light'
import { Field, FieldProps, Form, Formik } from 'formik'
import * as React from 'react'
import { FieldWithErrorMessage } from '../../components/FieldWithErrorMessage'
import { Dec } from '../../utils/Decimal'
import { formatBalance } from '../../utils/formatting'
import { useAddress } from '../../utils/useAddress'
import { getBalanceDec, useBalances } from '../../utils/useBalances'
import { useCentrifugeTransaction } from '../../utils/useCentrifugeTransaction'
import { usePool } from '../../utils/usePools'
import { combine, max, positiveNumber } from '../../utils/validation'

type FinanceValues = {
  amount: number | Decimal | ''
}

type RepayValues = {
  amount: number | Decimal | ''
}

const SEC_PER_DAY = 24 * 60 * 60

export const FinanceForm: React.VFC<{ loan: LoanType }> = ({ loan }) => {
  const pool = usePool(loan.poolId)
  const address = useAddress()
  const balances = useBalances(address)
  const balance = balances && pool ? getBalanceDec(balances, pool.currency) : Dec(0)
  const { execute: doFinanceTransaction, isLoading: isFinanceLoading } = useCentrifugeTransaction(
    'Finance asset',
    (cent) => cent.pools.financeLoan
  )

  const { execute: doRepayTransaction, isLoading: isRepayLoading } = useCentrifugeTransaction(
    'Repay asset',
    (cent) => cent.pools.repayLoanPartially
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
  const initialCeiling = loan.loanInfo.value.toDecimal().mul(loan.loanInfo.advanceRate.toDecimal())
  let ceiling = initialCeiling
  if (loan.loanInfo.type === 'BulletLoan') {
    ceiling = ceiling.minus(loan.totalBorrowed.toDecimal())
  } else {
    ceiling = ceiling.minus(debtWithMargin)
    ceiling = ceiling.isNegative() ? Dec(0) : ceiling
  }
  const maxBorrow = poolReserve.lessThan(ceiling) ? poolReserve : ceiling
  const canRepayAll = debtWithMargin.lte(balance)

  return (
    <Stack gap={3}>
      <Stack as={Card} gap={2} p={2}>
        <Stack>
          <Shelf justifyContent="space-between">
            <Text variant="heading3">Available financing</Text>
            <Text variant="heading3">{formatBalance(ceiling, pool?.currency)}</Text>
          </Shelf>
          <Shelf justifyContent="space-between">
            <Text variant="label1">Total financed</Text>
            <Text variant="label1">{formatBalance(loan.totalBorrowed, pool?.currency)}</Text>
          </Shelf>
        </Stack>
        {loan.status === 'Active' && loan.totalBorrowed.toDecimal().lt(initialCeiling) && (
          <Formik<FinanceValues>
            initialValues={{
              amount: '',
            }}
            onSubmit={(values, actions) => {
              const amount = Balance.fromFloat(values.amount)
              doFinanceTransaction([loan.poolId, loan.id, amount])
              actions.setSubmitting(false)
            }}
            validateOnMount
          >
            {(form) => (
              <Stack as={Form} gap={2} noValidate>
                <Field
                  name="amount"
                  validate={combine(
                    positiveNumber(),
                    max(ceiling.toNumber(), 'amount exceeds available financing'),
                    max(maxBorrow.toNumber(), 'amount exceeds pool reserve')
                  )}
                >
                  {({ field: { value, ...fieldProps }, meta }: FieldProps) => (
                    <CurrencyInput
                      {...fieldProps}
                      value={value instanceof Decimal ? value.toNumber() : value}
                      label="Amount"
                      min="0"
                      onSetMax={() => form.setFieldValue('amount', maxBorrow)}
                      errorMessage={meta.touched ? meta.error : undefined}
                      disabled={isFinanceLoading}
                    />
                  )}
                </Field>
                <Stack px={1}>
                  <Button type="submit" disabled={!form.isValid} loading={isFinanceLoading}>
                    Finance asset
                  </Button>
                </Stack>
              </Stack>
            )}
          </Formik>
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
          <Formik<RepayValues>
            initialValues={{
              amount: '',
            }}
            onSubmit={(values, actions) => {
              const amount = Balance.fromFloat(values.amount)
              doRepayTransaction([loan.poolId, loan.id, amount])
              actions.setSubmitting(false)
            }}
            validateOnMount
          >
            {(form) => (
              <Stack as={Form} gap={2} noValidate>
                <FieldWithErrorMessage
                  validate={combine(
                    positiveNumber(),
                    max(balance.toNumber(), 'amount exceeds balance'),
                    max(debt.toNumber(), 'amount exceeds debt')
                  )}
                  as={CurrencyInput}
                  name="amount"
                  label="Amount"
                  min="0"
                  disabled={isRepayLoading || isRepayAllLoading}
                  secondaryLabel={pool && balance && `${formatBalance(balance, pool?.currency)} balance`}
                />
                <Stack gap={1} px={1}>
                  <Button type="submit" disabled={!form.isValid || isRepayAllLoading} loading={isRepayLoading}>
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
            )}
          </Formik>
        )}
      </Stack>
    </Stack>
  )
}
