import { Balance, Loan as LoanType } from '@centrifuge/centrifuge-js'
import { Box, Button, Card, Grid, NumberInput, Shelf, Stack, Text } from '@centrifuge/fabric'
import Decimal from 'decimal.js-light'
import { Field, Form, Formik, FormikErrors } from 'formik'
import * as React from 'react'
import { CardHeader } from '../../components/CardHeader'
import { LabelValueStack } from '../../components/LabelValueStack'
import { PageSummary } from '../../components/PageSummary'
import { ButtonTextLink } from '../../components/TextLink'
import { Dec } from '../../utils/Decimal'
import { formatBalance } from '../../utils/formatting'
import { useCentrifugeTransaction } from '../../utils/useCentrifugeTransaction'
import { usePool } from '../../utils/usePools'

type FinanceValues = {
  amount: number | Decimal
}

type RepayValues = {
  amount: number | Decimal
}

function validateNumberInput(value: number | string, min: number | Decimal, max?: number | Decimal) {
  if (value === '') {
    return 'Not a valid number'
  }
  if (max && Dec(value).greaterThan(Dec(max))) {
    return 'Value too large'
  }
  if (Dec(value).lessThan(Dec(min))) {
    return 'Value too small'
  }
}

export const FinanceForm: React.VFC<{ loan: LoanType }> = ({ loan }) => {
  const pool = usePool(loan.poolId)
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
  const poolReserve = pool?.reserve.available.toDecimal() ?? Dec(0)
  let ceiling = loan.loanInfo.value.toDecimal().mul(loan.loanInfo.advanceRate.toDecimal())
  if (loan.loanInfo.type === 'BulletLoan') {
    ceiling = ceiling.minus(loan.totalBorrowed.toDecimal())
  } else {
    ceiling = ceiling.minus(debt)
    ceiling = ceiling.isNegative() ? Dec(0) : ceiling
  }
  const maxBorrow = poolReserve.lessThan(ceiling) ? poolReserve : ceiling

  return (
    <Card p={3}>
      <Stack gap={3}>
        <CardHeader title="Finance &amp; Repay" />

        <PageSummary>
          <LabelValueStack
            label="Total borrowed amount"
            value={`${formatBalance(loan?.totalBorrowed, pool?.currency)}`}
          />
          <LabelValueStack
            label="Current debt"
            value={`${formatBalance(loan?.outstandingDebt, pool?.currency, true)}`}
          />
        </PageSummary>
        <Grid columns={[1, 2]} equalColumns gap={3} rowGap={5}>
          <Formik
            initialValues={{
              amount: 0,
            }}
            onSubmit={(values, actions) => {
              const amount = Balance.fromFloat(values.amount)
              doFinanceTransaction([loan.poolId, loan.id, amount])
              actions.setSubmitting(false)
            }}
            validate={(values) => {
              const errors: FormikErrors<FinanceValues> = {}

              if (validateNumberInput(values.amount, 0)) {
                errors.amount = validateNumberInput(values.amount, 0)
              }

              return errors
            }}
            validateOnMount
          >
            {(form) => (
              <Stack as={Form} gap={3} noValidate>
                <Stack>
                  <Field name="amount">
                    {({ field: { value, ...fieldProps } }: any) => (
                      <NumberInput
                        {...fieldProps}
                        value={value instanceof Decimal ? value.toNumber() : value}
                        label="Finance amount"
                        type="number"
                        min="0"
                      />
                    )}
                  </Field>
                  <Text>
                    <ButtonTextLink
                      onClick={() => {
                        form.setFieldValue('amount', maxBorrow)
                      }}
                    >
                      {/* TODO: With credit lines, the max borrow is limited by the debt, so if there's outstanding debt, 
                          the actual max is a little less by the time the form is submitted. Maybe it should be rounded down */}
                      Set max
                    </ButtonTextLink>
                  </Text>
                </Stack>
                <Box mt="auto">
                  <Button type="submit" variant="outlined" disabled={!form.isValid} loading={isFinanceLoading}>
                    Finance asset
                  </Button>
                </Box>
              </Stack>
            )}
          </Formik>

          <Formik
            initialValues={{
              amount: 0,
            }}
            onSubmit={(values, actions) => {
              const amount = Balance.fromFloat(values.amount)
              doRepayTransaction([loan.poolId, loan.id, amount])
              actions.setSubmitting(false)
            }}
            validate={(values) => {
              const errors: FormikErrors<RepayValues> = {}

              if (validateNumberInput(values.amount, 0)) {
                errors.amount = validateNumberInput(values.amount, 0)
              }

              return errors
            }}
            validateOnMount
          >
            {(form) => (
              <Stack as={Form} gap={3} noValidate>
                <Field as={NumberInput} name="amount" label="Repay amount" min="0" />
                <Shelf mt="auto" gap={2}>
                  <Button type="submit" variant="outlined" disabled={!form.isValid} loading={isRepayLoading}>
                    Repay asset
                  </Button>
                  <Button variant="outlined" loading={isRepayAllLoading} onClick={() => repayAll()}>
                    Repay all and close
                  </Button>
                </Shelf>
              </Stack>
            )}
          </Formik>
        </Grid>
      </Stack>
    </Card>
  )
}
