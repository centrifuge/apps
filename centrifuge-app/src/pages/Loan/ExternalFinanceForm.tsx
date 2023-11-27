import {
  CurrencyBalance,
  ExternalPricingInfo,
  findBalance,
  Loan as LoanType,
  Price,
  WithdrawAddress,
} from '@centrifuge/centrifuge-js'
import { roundDown, useBalances, useCentrifugeTransaction } from '@centrifuge/centrifuge-react'
import { Box, Button, Card, CurrencyInput, Shelf, Stack, Text } from '@centrifuge/fabric'
import BN from 'bn.js'
import Decimal from 'decimal.js-light'
import { Field, FieldProps, Form, FormikProvider, useFormik } from 'formik'
import * as React from 'react'
import { Dec } from '../../utils/Decimal'
import { formatBalance } from '../../utils/formatting'
import { useFocusInvalidInput } from '../../utils/useFocusInvalidInput'
import { useAvailableFinancing } from '../../utils/useLoans'
import { useBorrower } from '../../utils/usePermissions'
import { usePool } from '../../utils/usePools'
import { combine, maxPriceVariance, positiveNumber, settlementPrice } from '../../utils/validation'
import { WithdrawSelect } from './FinanceForm'

type FinanceValues = {
  price: number | '' | Decimal
  faceValue: number | ''
  withdraw: undefined | WithdrawAddress
}

type RepayValues = {
  price: number | '' | Decimal
  faceValue: number | ''
}

type ExternalLoan = LoanType & {
  pricing: ExternalPricingInfo
}

export function ExternalFinanceForm({ loan }: { loan: ExternalLoan }) {
  const pool = usePool(loan.poolId)
  const account = useBorrower(loan.poolId, loan.id)
  if (!account) throw new Error('No borrower')
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
      faceValue: '',
      withdraw: undefined,
    },
    onSubmit: (values, actions) => {
      const price = CurrencyBalance.fromFloat(values.price, pool.currency.decimals)
      const quantity = Price.fromFloat(Dec(values.faceValue).div(loan.pricing.notional.toDecimal()))

      doFinanceTransaction(
        [
          loan.poolId,
          loan.id,
          quantity,
          price,
          values.withdraw ? { ...values.withdraw, currency: pool.currency.key } : undefined,
        ],
        {
          account,
        }
      )
      actions.setSubmitting(false)
    },
    validateOnMount: true,
  })

  const currentFace =
    loan?.pricing && 'outstandingQuantity' in loan.pricing
      ? loan.pricing.outstandingQuantity.toDecimal().mul(loan.pricing.notional.toDecimal())
      : null

  const repayForm = useFormik<RepayValues>({
    initialValues: {
      price: '',
      faceValue: '',
    },
    onSubmit: (values, actions) => {
      const price = CurrencyBalance.fromFloat(values.price, pool.currency.decimals)
      const quantity = Price.fromFloat(Dec(values.faceValue).div(loan.pricing.notional.toDecimal()))

      doRepayTransaction([loan.poolId, loan.id, quantity, new BN(0), new BN(0), price], {
        account,
      })
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
        <Box paddingY={1}>
          <Text variant="heading4">
            To finance the asset, enter face value and settlement price of the transaction.
          </Text>
        </Box>
        {availableFinancing.greaterThan(0) && !maturityDatePassed && (
          <FormikProvider value={financeForm}>
            <Stack as={Form} gap={2} noValidate ref={financeFormRef}>
              <Field name="faceValue" validate={combine(positiveNumber())}>
                {({ field, meta, form }: FieldProps) => {
                  return (
                    <CurrencyInput
                      {...field}
                      label="Face value"
                      disabled={isFinanceLoading}
                      errorMessage={meta.touched ? meta.error : undefined}
                      placeholder="0.0"
                      precision={6}
                      variant="small"
                      onChange={(value) => form.setFieldValue('faceValue', value)}
                      currency={pool.currency.symbol}
                    />
                  )
                }}
              </Field>
              <Field
                name="price"
                validate={combine(
                  settlementPrice(),
                  (val) => {
                    const num = val instanceof Decimal ? val.toNumber() : val
                    const financeAmount = Dec(num)
                      .mul(financeForm.values.faceValue || 1)
                      .div(loan.pricing.notional.toDecimal())

                    return financeAmount.gt(availableFinancing)
                      ? `Amount exceeds available reserve (${formatBalance(
                          availableFinancing,
                          pool?.currency.symbol,
                          2
                        )})`
                      : ''
                  },
                  (val) => {
                    const financeAmount = Dec(val)
                      .mul(financeForm.values.faceValue || 1)
                      .div(loan.pricing.notional.toDecimal())

                    return financeAmount.gt(maxBorrow)
                      ? `Amount exceeds max borrow (${formatBalance(maxBorrow, pool.currency.symbol, 2)})`
                      : ''
                  },
                  maxPriceVariance(loan.pricing)
                )}
              >
                {({ field, meta, form }: FieldProps) => {
                  return (
                    <CurrencyInput
                      {...field}
                      label="Settlement price"
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
              <WithdrawSelect loan={loan} borrower={account} />
              <Stack gap={1}>
                <Shelf justifyContent="space-between">
                  <Text variant="emphasized">Total amount</Text>
                  <Text variant="emphasized">
                    {financeForm.values.price && !Number.isNaN(financeForm.values.price as number)
                      ? formatBalance(
                          Dec(financeForm.values.price || 0)
                            .mul(Dec(financeForm.values.faceValue || 0))
                            .div(loan.pricing.notional.toDecimal()),
                          pool?.currency.symbol,
                          2
                        )
                      : `0.00 ${pool.currency.symbol}`}
                  </Text>
                </Shelf>
              </Stack>
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
        <Box paddingY={1}>
          <Text variant="heading4">To repay the asset, enter face value and settlement price of the transaction.</Text>
        </Box>

        {currentFace ? (
          <Stack>
            <Shelf justifyContent="space-between">
              <Text variant="label2">Current face</Text>
              <Text variant="label2">{formatBalance(currentFace, pool.currency.symbol, 2, 2)}</Text>
            </Shelf>
          </Stack>
        ) : null}

        {loan.status !== 'Created' &&
          (debt.gt(0) ? (
            <FormikProvider value={repayForm}>
              <Stack as={Form} gap={2} noValidate ref={repayFormRef}>
                <Field validate={combine(positiveNumber())} name="faceValue">
                  {({ field, meta, form }: FieldProps) => {
                    return (
                      <CurrencyInput
                        {...field}
                        label="Face value"
                        disabled={isRepayLoading}
                        errorMessage={meta.touched ? meta.error : undefined}
                        placeholder="0.0"
                        precision={6}
                        variant="small"
                        onChange={(value) => form.setFieldValue('faceValue', value)}
                        currency={pool.currency.symbol}
                      />
                    )
                  }}
                </Field>
                <Field
                  validate={combine(
                    settlementPrice(),
                    (val) => {
                      const num = val instanceof Decimal ? val.toNumber() : val
                      const repayAmount = Dec(num)
                        .mul(repayForm.values.faceValue || 1)
                        .div(loan.pricing.notional.toDecimal())

                      return repayAmount.gt(balance)
                        ? `Your wallet balance (${formatBalance(
                            roundDown(balance),
                            pool?.currency.symbol,
                            2
                          )}) is smaller than
                    the outstanding balance.`
                        : ''
                    },
                    maxPriceVariance(loan.pricing)
                  )}
                  name="price"
                >
                  {({ field, meta, form }: FieldProps) => {
                    return (
                      <CurrencyInput
                        {...field}
                        variant="small"
                        label="Settlement price"
                        disabled={isRepayLoading}
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
                    <Text variant="emphasized">Total amount</Text>
                    <Text variant="emphasized">
                      {repayForm.values.price && !Number.isNaN(repayForm.values.price as number)
                        ? formatBalance(
                            Dec(repayForm.values.price || 0)
                              .mul(Dec(repayForm.values.faceValue || 0))
                              .div(loan.pricing.notional.toDecimal()),
                            pool?.currency.symbol,
                            2
                          )
                        : `0.00 ${pool.currency.symbol}`}
                    </Text>
                  </Shelf>
                </Stack>
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
