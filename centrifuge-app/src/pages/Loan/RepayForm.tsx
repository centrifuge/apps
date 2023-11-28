import { ActiveLoan, CurrencyBalance, findBalance } from '@centrifuge/centrifuge-js'
import { useBalances, useCentrifugeTransaction } from '@centrifuge/centrifuge-react'
import { Button, Card, CurrencyInput, InlineFeedback, Shelf, Stack, Text } from '@centrifuge/fabric'
import BN from 'bn.js'
import Decimal from 'decimal.js-light'
import { Field, FieldProps, Form, FormikProvider, useFormik } from 'formik'
import * as React from 'react'
import { Dec } from '../../utils/Decimal'
import { formatBalance, roundDown } from '../../utils/formatting'
import { useFocusInvalidInput } from '../../utils/useFocusInvalidInput'
import { useAvailableFinancing } from '../../utils/useLoans'
import { useBorrower } from '../../utils/usePermissions'
import { usePool } from '../../utils/usePools'
import { combine, max, positiveNumber } from '../../utils/validation'
import { ExternalRepayForm } from './ExternalRepayForm'
import { isExternalLoan } from './utils'

type RepayValues = {
  amount: number | '' | Decimal
}

export function RepayForm({ loan }: { loan: ActiveLoan }) {
  return isExternalLoan(loan) ? <ExternalRepayForm loan={loan} /> : <InternalRepayForm loan={loan} />
}

function InternalRepayForm({ loan }: { loan: ActiveLoan }) {
  const pool = usePool(loan.poolId)
  const account = useBorrower(loan.poolId, loan.id)
  if (!account) throw new Error('No borrower')
  const balances = useBalances(account.actingAddress)
  const balance = (balances && findBalance(balances.currencies, pool.currency.key)?.balance.toDecimal()) || Dec(0)
  const { debtWithMargin } = useAvailableFinancing(loan.poolId, loan.id)

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
    doRepayAllTransaction([loan.poolId, loan.id, loan.totalBorrowed.sub(loan.repaid.principal)], {
      account,
      forceProxyType: 'Borrow',
    })
  }

  const repayForm = useFormik<RepayValues>({
    initialValues: {
      amount: '',
    },
    onSubmit: (values, actions) => {
      const outstandingPrincipal = loan.totalBorrowed.sub(loan.repaid.principal)
      let amount: BN = CurrencyBalance.fromFloat(values.amount, pool.currency.decimals)
      let interest = new BN(0)
      if (amount.gt(outstandingPrincipal)) {
        interest = amount.sub(outstandingPrincipal)
        amount = outstandingPrincipal
      }
      doRepayTransaction([loan.poolId, loan.id, amount, interest, new BN(0)], { account, forceProxyType: 'Borrow' })
      actions.setSubmitting(false)
    },
    validateOnMount: true,
  })

  const repayFormRef = React.useRef<HTMLFormElement>(null)
  useFocusInvalidInput(repayForm, repayFormRef)

  const debt = loan.outstandingDebt?.toDecimal() || Dec(0)
  const maxRepay = balance.lessThan(loan.outstandingDebt.toDecimal()) ? balance : loan.outstandingDebt.toDecimal()
  const canRepayAll = debtWithMargin?.lte(balance)

  return (
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
    </Stack>
  )
}
