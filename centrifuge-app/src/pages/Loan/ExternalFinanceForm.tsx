import { CurrencyBalance, ExternalLoan, Pool, Price, WithdrawAddress } from '@centrifuge/centrifuge-js'
import { useCentrifugeTransaction } from '@centrifuge/centrifuge-react'
import { Box, Button, Card, CurrencyInput, Shelf, Stack, Text } from '@centrifuge/fabric'
import Decimal from 'decimal.js-light'
import { Field, FieldProps, Form, FormikProvider, useFormik, useFormikContext } from 'formik'
import * as React from 'react'
import { Dec, min } from '../../utils/Decimal'
import { formatBalance } from '../../utils/formatting'
import { useFocusInvalidInput } from '../../utils/useFocusInvalidInput'
import { useAvailableFinancing } from '../../utils/useLoans'
import { useBorrower } from '../../utils/usePermissions'
import { usePool } from '../../utils/usePools'
import { combine, maxPriceVariance, nonNegativeNumber, settlementPrice } from '../../utils/validation'
import { WithdrawSelect } from './FinanceForm'

type FinanceValues = {
  price: number | '' | Decimal
  faceValue: number | ''
  withdraw: undefined | WithdrawAddress
}

export function ExternalFinanceForm({ loan }: { loan: ExternalLoan }) {
  const pool = usePool(loan.poolId) as Pool
  const account = useBorrower(loan.poolId, loan.id)
  if (!account) throw new Error('No borrower')
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

  const financeFormRef = React.useRef<HTMLFormElement>(null)
  useFocusInvalidInput(financeForm, financeFormRef)

  if (loan.status === 'Closed' || ('valuationMethod' in loan.pricing && loan.pricing.valuationMethod !== 'oracle')) {
    return null
  }

  const maturityDatePassed =
    loan?.pricing && 'maturityDate' in loan.pricing && new Date() > new Date(loan.pricing.maturityDate)

  return (
    <Stack as={Card} gap={2} p={2}>
      <Box paddingY={1}>
        <Text variant="heading4">To finance the asset, enter face value and settlement price of the transaction.</Text>
      </Box>
      {availableFinancing.greaterThan(0) && !maturityDatePassed && (
        <FormikProvider value={financeForm}>
          <Stack as={Form} gap={2} noValidate ref={financeFormRef}>
            <ExternalFinanceFields loan={loan} pool={pool} />
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
  )
}

export function ExternalFinanceFields({
  loan,
  pool,
  validate,
}: {
  loan: ExternalLoan
  pool: Pool
  validate?: (val: any) => string
}) {
  const form = useFormikContext<FinanceValues>()
  const { current: availableFinancing } = useAvailableFinancing(loan.poolId, loan.id)
  const poolReserve = pool?.reserve.available.toDecimal() ?? Dec(0)
  const maxBorrow = min(poolReserve, availableFinancing)
  return (
    <>
      <Field name="faceValue" validate={combine(nonNegativeNumber())}>
        {({ field, meta, form }: FieldProps) => {
          return (
            <CurrencyInput
              {...field}
              label="Face value"
              errorMessage={meta.touched ? meta.error : undefined}
              decimals={8}
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
          validate ??
            ((val) => {
              const financeAmount = Dec(val)
                .mul(form.values.faceValue || 1)
                .div(loan.pricing.notional.toDecimal())

              return financeAmount.gt(maxBorrow)
                ? `Amount exceeds max borrow (${formatBalance(maxBorrow, pool.currency.symbol, 2)})`
                : ''
            }),
          maxPriceVariance(loan.pricing)
        )}
      >
        {({ field, meta, form }: FieldProps) => {
          return (
            <CurrencyInput
              {...field}
              label="Settlement price"
              errorMessage={meta.touched ? meta.error : undefined}
              currency={pool.currency.symbol}
              onChange={(value) => form.setFieldValue('price', value)}
              decimals={8}
            />
          )
        }}
      </Field>
    </>
  )
}
