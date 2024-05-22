import { ActiveLoan, CurrencyBalance, Loan, Loan as LoanType, Pool, Price } from '@centrifuge/centrifuge-js'
import { useCentrifugeTransaction } from '@centrifuge/centrifuge-react'
import { Button, Card, CurrencyInput, Select, Shelf, Stack, Text } from '@centrifuge/fabric'
import BN from 'bn.js'
import Decimal from 'decimal.js-light'
import { Field, FieldProps, Form, FormikProvider, setIn, useFormik } from 'formik'
import * as React from 'react'
import { nftMetadataSchema } from '../../schemas'
import { Dec } from '../../utils/Decimal'
import { formatBalance } from '../../utils/formatting'
import { useFocusInvalidInput } from '../../utils/useFocusInvalidInput'
import { useAvailableFinancing, useLoans } from '../../utils/useLoans'
import { useMetadata } from '../../utils/useMetadata'
import { useCentNFT } from '../../utils/useNFTs'
import { useBorrower } from '../../utils/usePermissions'
import { usePool } from '../../utils/usePools'
import { combine, maxPriceVariance, positiveNumber, settlementPrice } from '../../utils/validation'
import { ExternalFinanceFields } from './ExternalFinanceForm'
import { isExternalLoan } from './utils'

type FormValues = {
  targetLoan: string
  amount: number | '' | Decimal
  price: number | '' | Decimal
  faceValue: number | ''
  targetLoanFaceValue: number | '' | Decimal
  targetLoanPrice: number | '' | Decimal
}

export function TransferDebtForm({ loan }: { loan: LoanType }) {
  const pool = usePool(loan.poolId) as Pool
  const account = useBorrower(loan.poolId, loan.id)

  if (!account) throw new Error('No borrower')
  const { current: availableFinancing } = useAvailableFinancing(loan.poolId, loan.id)
  const unfilteredLoans = useLoans(loan.poolId)

  const loans = unfilteredLoans?.filter(
    (l) =>
      l.id !== loan.id &&
      l.status === 'Active' &&
      (l as ActiveLoan).borrower === account?.actingAddress &&
      (isExternalLoan(loan) ? !isExternalLoan(l as Loan) : true)
  ) as Loan[] | undefined

  const { execute, isLoading } = useCentrifugeTransaction('Transfer debt', (cent) => cent.pools.transferLoanDebt, {
    onSuccess: () => {
      form.resetForm()
    },
  })

  const form = useFormik<FormValues>({
    initialValues: {
      targetLoan: '',
      amount: '',
      price: '',
      faceValue: '',
      targetLoanPrice: '',
      targetLoanFaceValue: '',
    },
    onSubmit: (values, actions) => {
      if (!selectedLoan) return

      let borrow: any
      let borrowAmount: BN
      if (isExternalLoan(loan)) {
        borrow = {
          price: CurrencyBalance.fromFloat(values.price, pool.currency.decimals),
          quantity: Price.fromFloat(Dec(values.faceValue).div(loan.pricing.notional.toDecimal())),
        }
        borrowAmount = borrow.quantity.mul(borrow.price).div(Price.fromFloat(1))
      } else if (isExternalLoan(selectedLoan)) {
        borrow = { amount: CurrencyBalance.fromFloat(financeAmount, pool.currency.decimals) }
        borrowAmount = borrow.amount
      } else {
        borrow = { amount: CurrencyBalance.fromFloat(values.amount, pool.currency.decimals) }
        borrowAmount = borrow.amount
      }

      const { outstandingInterest } = selectedLoan
      let interest = new BN(borrowAmount)
      let principal = new BN(0)
      if (interest.gt(outstandingInterest)) {
        interest = outstandingInterest
        principal = interest.sub(outstandingInterest)
      }
      let repay: any = { principal, interest }
      if (isExternalLoan(selectedLoan)) {
        const repayPriceBN = CurrencyBalance.fromFloat(form.values.targetLoanPrice || 1, pool.currency.decimals)
        const repayQuantityBN = Price.fromFloat(
          Dec(values.targetLoanFaceValue || 0).div(selectedLoan.pricing.notional.toDecimal())
        )
        repay = { quantity: repayQuantityBN, price: repayPriceBN, interest }
      }

      execute([loan.poolId, form.values.targetLoan, loan.id, repay, borrow], {
        account,
        forceProxyType: 'Borrow',
      })
      actions.setSubmitting(false)
    },
    validate(values) {
      const financeAmount = isExternalLoan(loan)
        ? Dec(values.price || 0)
            .mul(Dec(values.faceValue || 0))
            .div(loan.pricing.notional.toDecimal())
        : selectedLoan && isExternalLoan(selectedLoan)
        ? Dec(values.targetLoanPrice || 0)
            .mul(Dec(values.targetLoanFaceValue || 0))
            .div(selectedLoan.pricing.notional.toDecimal())
        : Dec(values.amount || 0)

      let errors: any = {}

      const error = validate(financeAmount)
      if (error) {
        if (selectedLoan && isExternalLoan(selectedLoan)) {
          errors = setIn(errors, 'targetLoanPrice', error)
        } else {
          errors = setIn(errors, 'amount', error)
        }
      }

      return errors
    },
  })

  const financeFormRef = React.useRef<HTMLFormElement>(null)
  useFocusInvalidInput(form, financeFormRef)

  if (loan.status === 'Closed') {
    return null
  }

  const maturityDatePassed =
    loan?.pricing && 'maturityDate' in loan.pricing && new Date() > new Date(loan.pricing.maturityDate)
  const selectedLoan = loans?.find((l) => l.id === form.values.targetLoan) as ActiveLoan | undefined

  function validate(financeAmount: Decimal) {
    if (financeAmount.lte(0)) return 'Value must be positive'
    return financeAmount.gt(availableFinancing)
      ? `Amount exceeds max borrow (${formatBalance(availableFinancing, pool.currency.symbol, 2)})`
      : financeAmount.gt(selectedLoan?.outstandingDebt.toDecimal() ?? Dec(0))
      ? `Amount ${financeAmount.toNumber()} exceeds settlement asset outstanding debt (${formatBalance(
          selectedLoan?.outstandingDebt.toFloat() ?? 0,
          pool?.currency.symbol,
          2
        )})`
      : ''
  }

  if (availableFinancing.lte(0) || maturityDatePassed || !loans?.length) return null

  const financeAmount = isExternalLoan(loan)
    ? Dec(form.values.price || 0)
        .mul(Dec(form.values.faceValue || 0))
        .div(loan.pricing.notional.toDecimal())
    : selectedLoan && isExternalLoan(selectedLoan)
    ? Dec(form.values.targetLoanPrice || 0)
        .mul(Dec(form.values.targetLoanFaceValue || 0))
        .div(selectedLoan.pricing.notional.toDecimal())
    : Dec(form.values.amount || 0)

  return (
    <Stack as={Card} gap={2} p={2}>
      <Text variant="heading4">
        To receive funds from another asset, choose the asset, enter new face value and settlement price. This will
        trigger a repay of the settlement asset and a borrow transaction for this asset.
      </Text>

      <FormikProvider value={form}>
        <Stack as={Form} gap={2} noValidate ref={financeFormRef}>
          {selectedLoan ? (
            <Shelf justifyContent="space-between">
              <Text variant="label2">Outstanding debt</Text>
              <Text variant="label2">{formatBalance(selectedLoan.outstandingDebt, pool.currency.symbol, 2, 2)}</Text>
            </Shelf>
          ) : null}
          <Field name="targetLoan">
            {({ field, meta, form }: FieldProps) => (
              <Select
                name="targetLoan"
                label="Settlement asset"
                onChange={(event) => {
                  form.setFieldValue('targetLoan', event.target.value)
                }}
                onBlur={field.onBlur}
                value={field.value}
                options={loans?.map((l) => ({ value: l.id, label: <LoanOption loan={l as Loan} key={l.id} /> })) ?? []}
                placeholder="Select..."
              />
            )}
          </Field>
          {isExternalLoan(loan) ? (
            <>
              <ExternalFinanceFields
                loan={loan}
                pool={pool}
                validate={(val) =>
                  validate(
                    Dec(val)
                      .mul(form.values.faceValue || 1)
                      .div(loan.pricing.notional.toDecimal())
                  )
                }
              />
              <Shelf justifyContent="space-between">
                <Text variant="emphasized">Total amount</Text>
                <Text variant="emphasized">
                  {form.values.price && !Number.isNaN(form.values.price as number)
                    ? formatBalance(financeAmount, pool?.currency.symbol, 2)
                    : `0.00 ${pool.currency.symbol}`}
                </Text>
              </Shelf>
            </>
          ) : !selectedLoan || !isExternalLoan(selectedLoan) ? (
            <Field name="amount" validate={(val: any) => validate(Dec(val || 0))}>
              {({ field, meta, form }: FieldProps) => {
                return (
                  <CurrencyInput
                    {...field}
                    value={field.value instanceof Decimal ? field.value.toNumber() : field.value}
                    label="Amount"
                    errorMessage={meta.touched ? meta.error : undefined}
                    currency={pool?.currency.symbol}
                    onChange={(value) => form.setFieldValue('amount', value)}
                  />
                )
              }}
            </Field>
          ) : null}
          {selectedLoan && isExternalLoan(selectedLoan) && (
            <>
              <Field validate={combine(positiveNumber())} name="targetLoanFaceValue">
                {({ field, meta, form }: FieldProps) => {
                  return (
                    <CurrencyInput
                      {...field}
                      label="Face value (settlement asset)"
                      errorMessage={meta.touched ? meta.error : undefined}
                      decimals={8}
                      onChange={(value) => form.setFieldValue('targetLoanFaceValue', value)}
                      currency={pool.currency.symbol}
                    />
                  )
                }}
              </Field>
              <Field
                name="targetLoanPrice"
                validate={combine(settlementPrice(), maxPriceVariance(selectedLoan.pricing))}
              >
                {({ field, meta, form }: FieldProps) => {
                  return (
                    <CurrencyInput
                      {...field}
                      label="Settlement price (settlement asset)"
                      errorMessage={meta.touched ? meta.error : undefined}
                      currency={pool.currency.symbol}
                      onChange={(value) => form.setFieldValue('targetLoanPrice', value)}
                      decimals={8}
                    />
                  )
                }}
              </Field>
              <Shelf justifyContent="space-between">
                <Text variant="emphasized">Total amount</Text>
                <Text variant="emphasized">{formatBalance(financeAmount, pool?.currency.symbol, 2)}</Text>
              </Shelf>
            </>
          )}
          <Stack px={1}>
            <Button type="submit" loading={isLoading}>
              Receive debt
            </Button>
          </Stack>
        </Stack>
      </FormikProvider>
    </Stack>
  )
}

function LoanOption({ loan }: { loan: Loan }) {
  const nft = useCentNFT(loan.asset.collectionId, loan.asset.nftId, false, false)
  const { data: metadata } = useMetadata(nft?.metadataUri, nftMetadataSchema)
  return (
    <>
      {loan.id} - {metadata?.name}
    </>
  )
}
