import {
  ActiveLoan,
  CurrencyBalance,
  Loan,
  Loan as LoanType,
  Pool,
  Price,
  TinlakeLoan,
} from '@centrifuge/centrifuge-js'
import { useCentrifugeTransaction } from '@centrifuge/centrifuge-react'
import { Button, Card, CurrencyInput, Select, Shelf, Stack, Text } from '@centrifuge/fabric'
import BN from 'bn.js'
import Decimal from 'decimal.js-light'
import { Field, FieldProps, Form, FormikProvider, useFormik } from 'formik'
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
import { ExternalFinanceFields } from './ExternalFinanceForm'
import { isExternalLoan } from './utils'

type FormValues = {
  targetLoan: string
  amount: number | '' | Decimal
  price: number | '' | Decimal
  faceValue: number | ''
}

export function TransferDebtForm({ loan }: { loan: LoanType }) {
  const pool = usePool(loan.poolId) as Pool
  const account = useBorrower(loan.poolId, loan.id)

  if (!account) throw new Error('No borrower')
  const { current: availableFinancing } = useAvailableFinancing(loan.poolId, loan.id)
  const unfilteredLoans = useLoans(loan.poolId)

  // @ts-expect-error known typescript issue in v4.4.4: https://github.com/microsoft/TypeScript/issues/44373
  const loans = unfilteredLoans?.filter(
    (l: Loan | TinlakeLoan) =>
      l.id !== loan.id &&
      l.status === 'Active' &&
      (l as ActiveLoan).borrower === account?.actingAddress &&
      !isExternalLoan(l as any)
  ) as Loan[] | TinlakeLoan[] | undefined

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
      } else {
        borrow = { amount: CurrencyBalance.fromFloat(values.amount, pool.currency.decimals) }
        borrowAmount = borrow.amount
      }

      const outstandingPrincipal = selectedLoan.totalBorrowed.sub(selectedLoan.repaid.principal)
      let principal: BN = new BN(borrowAmount)
      let interest = new BN(0)
      if (principal.gt(outstandingPrincipal)) {
        interest = principal.sub(outstandingPrincipal)
        principal = outstandingPrincipal
      }

      execute([loan.poolId, form.values.targetLoan, loan.id, { principal, interest }, borrow], {
        account,
        forceProxyType: 'Borrow',
      })
      actions.setSubmitting(false)
    },
  })

  const financeFormRef = React.useRef<HTMLFormElement>(null)
  useFocusInvalidInput(form, financeFormRef)

  if (loan.status === 'Closed') {
    return null
  }

  const maturityDatePassed =
    loan?.pricing && 'maturityDate' in loan.pricing && new Date() > new Date(loan.pricing.maturityDate)
  // @ts-expect-error known typescript issue in v4.4.4: https://github.com/microsoft/TypeScript/issues/44373
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
                errorMessage={meta.touched && meta.error ? meta.error : undefined}
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
                    ? formatBalance(
                        Dec(form.values.price || 0)
                          .mul(Dec(form.values.faceValue || 0))
                          .div(loan.pricing.notional.toDecimal()),
                        pool?.currency.symbol,
                        2
                      )
                    : `0.00 ${pool.currency.symbol}`}
                </Text>
              </Shelf>
            </>
          ) : (
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
    <option value={loan.id}>
      {loan.id} - {metadata?.name}
    </option>
  )
}
