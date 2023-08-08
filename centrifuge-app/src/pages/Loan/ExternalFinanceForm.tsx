import { CurrencyBalance, ExternalPricingInfo, findBalance, Loan as LoanType } from '@centrifuge/centrifuge-js'
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

export function ExternalFinanceForm({ loan }: { loan: LoanType }) {
  const pool = usePool(loan.poolId)
  const account = useBorrower(loan.poolId, loan.id)
  const balances = useBalances(account.actingAddress)
  const balance = (balances && findBalance(balances.currencies, pool.currency.key)?.balance.toDecimal()) || Dec(0)
  const { current: availableFinancing } = useAvailableFinancing(loan.poolId, loan.id)
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
    (cent) => cent.pools.repayExternalLoanPartially,
    {
      onSuccess: () => {
        repayForm.resetForm()
      },
    }
  )

  const { execute: doCloseTransaction, isLoading: isCloseLoading } = useCentrifugeTransaction(
    'Close asset',
    (cent) => cent.pools.closeLoan
  )

  const financeForm = useFormik<FinanceValues>({
    initialValues: {
      price: '',
      quantity: '',
    },
    onSubmit: (values, actions) => {
      const price = CurrencyBalance.fromFloat(values.price, pool.currency.decimals)
      const quantity = CurrencyBalance.fromFloat(
        values.quantity,
        27 // TODO: Will be 18 decimals after next chain update
      )

      doFinanceTransaction([
        loan.poolId,
        loan.id,
        quantity,
        price,
        (loan.pricing as ExternalPricingInfo).Isin,
        account.actingAddress,
      ])
      actions.setSubmitting(false)
    },
    validateOnMount: true,
  })

  const repayForm = useFormik<RepayValues>({
    initialValues: {
      price: '',
      quantity: '',
    },
    onSubmit: (values, actions) => {
      const price = CurrencyBalance.fromFloat(values.price, pool.currency.decimals)
      const quantity = CurrencyBalance.fromFloat(values.quantity, 27)

      doRepayTransaction([
        loan.poolId,
        loan.id,
        quantity,
        new BN(0),
        new BN(0),
        price,
        (loan.pricing as ExternalPricingInfo).Isin,
        account.actingAddress,
      ])
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
  const maturityDatePassed =
    loan?.pricing && 'maturityDate' in loan.pricing && new Date() > new Date(loan.pricing.maturityDate)

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
                  max(
                    loan.pricing.maxBorrowAmount
                      ?.toDecimal()
                      .sub(loan.pricing.outstandingQuantity?.toDecimal() || Dec(0))
                      .toNumber() ?? Infinity,
                    'Quantity exeeds max borrow quantity'
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
                      placeholder="0"
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
                      variant="small"
                      disabled={isFinanceLoading}
                      errorMessage={meta.touched ? meta.error : undefined}
                      currency={pool.currency.symbol}
                      onChange={(value) => form.setFieldValue('price', value)}
                      placeholder="0.0"
                      precision={6}
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
                          Dec(financeForm.values.price || 0).mul(Dec(financeForm.values.quantity || 0)),
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
              {(poolReserve.lessThan(availableFinancing) ||
                ('valuationMethod' in loan.pricing && !loan.pricing.maxBorrowAmount)) && (
                <Shelf alignItems="flex-start" justifyContent="start" gap="4px">
                  <IconInfo size="iconMedium" />
                  <Text variant="body3">
                    The pool&apos;s available reserve ({formatBalance(poolReserve, pool?.currency.symbol)}) is smaller
                    than the available financing
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
            <Text variant="label1">Outstanding</Text>
            {/* outstandingDebt needs to be rounded down, b/c onSetMax displays the rounded down value as well */}
            <Text variant="label1">
              {'valuationMethod' in loan.pricing && loan.pricing.valuationMethod === 'oracle'
                ? `${loan.pricing.outstandingQuantity.toFloat()} @ ${formatBalance(
                    loan.pricing.oracle.value,
                    pool?.currency.symbol,
                    2
                  )}`
                : ''}
            </Text>
          </Shelf>
        </Stack>

        {loan.status !== 'Created' &&
          (debt.gt(0) ? (
            <FormikProvider value={repayForm}>
              <Stack as={Form} gap={2} noValidate ref={repayFormRef}>
                <Field
                  validate={combine(
                    positiveNumber(),
                    max(loan.pricing.outstandingQuantity.toDecimal().toNumber(), 'Quantity exceeds outstanding'),
                    max(debt.toNumber(), 'Amount exceeds outstanding')
                  )}
                  name="quantity"
                >
                  {({ field, meta }: FieldProps) => {
                    return (
                      <NumberInput
                        {...field}
                        label="Quantity"
                        disabled={isRepayLoading}
                        errorMessage={meta.touched ? meta.error : undefined}
                        placeholder="0"
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
                      <CurrencyInput
                        {...field}
                        variant="small"
                        label="Price"
                        disabled={isRepayLoading}
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
                      {repayForm.values.price && !Number.isNaN(repayForm.values.price as number)
                        ? formatBalance(
                            Dec(repayForm.values.price || 0).mul(Dec(repayForm.values.quantity || 0)),
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
                {balance.lessThan(debt) && (
                  <InlineFeedback>
                    Your wallet balance ({formatBalance(roundDown(balance), pool?.currency.symbol, 2)}) is smaller than
                    the outstanding balance.
                  </InlineFeedback>
                )}
                <Stack gap={1} px={1}>
                  <Button type="submit" disabled={isRepayLoading} loading={isRepayLoading}>
                    Repay asset
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
