import { CurrencyBalance, ExternalLoan, findBalance, Price } from '@centrifuge/centrifuge-js'
import { roundDown, useBalances, useCentrifugeTransaction } from '@centrifuge/centrifuge-react'
import { Box, Button, Card, CurrencyInput, Shelf, Stack, Text } from '@centrifuge/fabric'
import BN from 'bn.js'
import Decimal from 'decimal.js-light'
import { Field, FieldProps, Form, FormikProvider, useFormik } from 'formik'
import * as React from 'react'
import { Dec } from '../../utils/Decimal'
import { formatBalance } from '../../utils/formatting'
import { useFocusInvalidInput } from '../../utils/useFocusInvalidInput'
import { useBorrower } from '../../utils/usePermissions'
import { usePool } from '../../utils/usePools'
import { combine, maxPriceVariance, positiveNumber, settlementPrice } from '../../utils/validation'

type RepayValues = {
  price: number | '' | Decimal
  faceValue: number | ''
}

export function ExternalRepayForm({ loan }: { loan: ExternalLoan }) {
  const pool = usePool(loan.poolId)
  const account = useBorrower(loan.poolId, loan.id)
  if (!account) throw new Error('No borrower')
  const balances = useBalances(account.actingAddress)
  const balance = (balances && findBalance(balances.currencies, pool.currency.key)?.balance.toDecimal()) || Dec(0)

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

  const repayFormRef = React.useRef<HTMLFormElement>(null)
  useFocusInvalidInput(repayForm, repayFormRef)

  if (loan.status === 'Closed' || ('valuationMethod' in loan.pricing && loan.pricing.valuationMethod !== 'oracle')) {
    return null
  }

  const debt = loan.outstandingDebt?.toDecimal() || Dec(0)

  return (
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
  )
}
