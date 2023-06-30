import { CurrencyBalance, findBalance, Loan as LoanType, Rate, TinlakeLoan } from '@centrifuge/centrifuge-js'
import { useBalances, useCentrifugeTransaction } from '@centrifuge/centrifuge-react'
import {
  Button,
  Card,
  CurrencyInput,
  IconInfo,
  InlineFeedback,
  NumberInput,
  Shelf,
  Stack,
  Text,
} from '@centrifuge/fabric'
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

type FinanceValues = {
  price: number | '' | Decimal
  quantity: number | ''
}

type RepayValues = {
  price: number | '' | Decimal
  quantity: number | ''
}

export function ExternalFinanceForm({ loan }: { loan: LoanType | TinlakeLoan }) {
  const pool = usePool(loan.poolId)
  const account = useBorrower(loan.poolId, loan.id)
  const balances = useBalances(account.actingAddress)
  const balance = (balances && findBalance(balances.currencies, pool.currency.key)?.balance.toDecimal()) || Dec(0)
  const { current: availableFinancing, debtWithMargin } = useAvailableFinancing(loan.poolId, loan.id)
  const { execute: doFinanceTransaction, isLoading: isFinanceLoading } = useCentrifugeTransaction(
    'Finance asset',
    (cent) => cent.pools.financeExternalLoan,
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
    doRepayAllTransaction([loan.poolId, loan.id], { account, forceProxyType: 'Borrow' })
  }

  const financeForm = useFormik<FinanceValues>({
    initialValues: {
      price: '',
      quantity: 0,
    },
    onSubmit: (values, actions) => {
      const price = Rate.fromFloat(values.price)
      const amount = new CurrencyBalance(
        price.muln(values.quantity || 0).div(new BN(10).pow(new BN(27 - pool.currency.decimals))),
        pool.currency.decimals
      )

      // @ts-expect-error
      doFinanceTransaction([loan.poolId, loan.id, amount, price, loan.pricing.Isin], {
        account,
        forceProxyType: 'Borrow',
      })
      actions.setSubmitting(false)
    },
    validateOnMount: true,
  })

  // TODO: const repayForm = useFormik<RepayValues>({
    initialValues: {
      price: '',
      quantity: '',
    },
    onSubmit: (values, actions) => {
      const amount = new BN(values.amount.toString())
        .mul(loan.pricing.oracle.value)
        .div(new BN(10).pow(new BN(27 - pool.currency.decimals)))
      doRepayTransaction([loan.poolId, loan.id, amount, new BN(0)], { account, forceProxyType: 'Borrow' })
      actions.setSubmitting(false)
    },
    validateOnMount: true,
  })

  const financeFormRef = React.useRef<HTMLFormElement>(null)
  useFocusInvalidInput(financeForm, financeFormRef)

  const repayFormRef = React.useRef<HTMLFormElement>(null)
  useFocusInvalidInput(repayForm, repayFormRef)

  if (loan.status === 'Closed' || ('valuationMethod' in loan.pricing && loan.pricing.valuationMethod !== 'oracle')) {
    return null
  }

  const debt = loan.outstandingDebt?.toDecimal() || Dec(0)
  const poolReserve = pool?.reserve.available.toDecimal() ?? Dec(0)
  const maxBorrow = poolReserve.lessThan(availableFinancing) ? poolReserve : availableFinancing
  const maxRepay = balance.lessThan(loan.outstandingDebt.toDecimal()) ? balance : loan.outstandingDebt.toDecimal()
  const canRepayAll = debtWithMargin?.lte(balance)

  const maturityDatePassed =
    loan?.pricing && 'maturityDate' in loan.pricing && new Date() > new Date(loan.pricing.maturityDate)

  console.log('price', financeForm.values)
  return (
    <Stack gap={3}>
      <Stack as={Card} gap={2} p={2}>
        <Stack>
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
                name="quantity"
                validate={combine(
                  positiveNumber(),
                  max(availableFinancing.toNumber(), 'Amount exceeds available financing'),
                  max(
                    maxBorrow.toNumber(),
                    `Amount exceeds available reserve (${formatBalance(maxBorrow, pool?.currency.symbol, 2)})`
                  )
                )}
              >
                {({ field, meta }: FieldProps) => {
                  return (
                    <NumberInput
                      {...field}
                      label="Quantity"
                      disabled={isFinanceLoading}
                      errorMessage={meta.touched ? meta.error : undefined}
                    />
                  )
                }}
              </Field>
              <Field
                name="price"
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
                      label="Price"
                      errorMessage={meta.touched ? meta.error : undefined}
                      currency={pool.currency.symbol}
                      onChange={(value) => form.setFieldValue('price', value)}
                    />
                  )
                }}
              </Field>
              <Stack gap={1}>
                <Shelf justifyContent="space-between">
                  <Text variant="body3">Total amount</Text>
                  <Text variant="body3">
                    {financeForm.values.price && !Number.isNaN(financeForm.values.price as number)
                      ? formatBalance(
                          CurrencyBalance.fromFloat(
                            new BN(financeForm.values.price?.toString() || 0)
                              .muln(financeForm.values.quantity || 0)
                              .toNumber(),
                            pool?.currency.decimals
                          ),
                          pool?.currency.symbol,
                          2
                        )
                      : `0.00 ${pool.currency.symbol}`}
                  </Text>
                </Shelf>
                <Text variant="body3" color="textSecondary">
                  This is calculated through the amount multiplied by the current price of the asset
                </Text>
              </Stack>
              {poolReserve.lessThan(availableFinancing) ||
                ('valuationMethod' in loan.pricing && !loan.pricing.maxBorrowQuantity && (
                  <Shelf alignItems="flex-start" justifyContent="start" gap="4px">
                    <IconInfo size="iconMedium" />
                    <Text variant="body3">
                      The pool&apos;s available reserve ({formatBalance(poolReserve, pool?.currency.symbol)}) is smaller
                      than the available financing
                    </Text>
                  </Shelf>
                ))}
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
              {'valuationMethod' in loan.pricing && loan.pricing.valuationMethod === 'oracle'
                ? `${
                    loan.pricing.outstandingQuantity
                      .div(new BN(10).pow(new BN(pool?.currency.decimals - 2)))
                      .toNumber() / 100
                  } x ${loan.pricing.oracle.value.toDecimal()} ${pool?.currency.symbol}:  ${formatBalance(
                    new CurrencyBalance(
                      loan.pricing.outstandingQuantity
                        .mul(new BN(loan.pricing.oracle.value))
                        .div(new BN(10).pow(new BN(27))),
                      pool?.currency.decimals
                    ),
                    pool?.currency.symbol,
                    2
                  )}`
                : ''}
            </Text>
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
                  name="quantity"
                >
                  {({ field, meta, form }: FieldProps) => {
                    return (
                      <NumberInput
                        {...field}
                        label="Quantity"
                        disabled={isRepayLoading || isRepayAllLoading}
                        errorMessage={meta.touched ? meta.error : undefined}
                      />
                    )
                  }}
                </Field>
                <Field
                  validate={combine(
                    positiveNumber(),
                    max(balance.toNumber(), 'Amount exceeds balance'),
                    max(debt.toNumber(), 'Amount exceeds outstanding')
                  )}
                  name="price"
                >
                  {({ field, meta, form }: FieldProps) => {
                    return (
                      <NumberInput
                        {...field}
                        label="Price"
                        disabled={isRepayLoading || isRepayAllLoading}
                        errorMessage={meta.touched ? meta.error : undefined}
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
