import { CurrencyBalance, ExternalLoan, Loan as LoanType, Pool, WithdrawAddress } from '@centrifuge/centrifuge-js'
import {
  CombinedSubstrateAccount,
  truncateAddress,
  useCentrifugeTransaction,
  useCentrifugeUtils,
  useGetNetworkName,
} from '@centrifuge/centrifuge-react'
import { Button, Card, CurrencyInput, InlineFeedback, Select, Shelf, Stack, Text } from '@centrifuge/fabric'
import Decimal from 'decimal.js-light'
import { Field, FieldProps, Form, FormikProvider, useField, useFormik, useFormikContext } from 'formik'
import * as React from 'react'
import { parachainNames } from '../../config'
import { Dec } from '../../utils/Decimal'
import { formatBalance, roundDown } from '../../utils/formatting'
import { useFocusInvalidInput } from '../../utils/useFocusInvalidInput'
import { useAvailableFinancing } from '../../utils/useLoans'
import { useBorrower, usePoolAccess } from '../../utils/usePermissions'
import { usePool } from '../../utils/usePools'
import { combine, max, positiveNumber } from '../../utils/validation'
import { ExternalFinanceForm } from './ExternalFinanceForm'
import { isExternalLoan } from './utils'

type FinanceValues = {
  amount: number | '' | Decimal
  withdraw: undefined | WithdrawAddress
}

type RepayValues = {
  amount: number | '' | Decimal
}

export function FinanceForm({ loan }: { loan: LoanType }) {
  return isExternalLoan(loan) ? (
    <ExternalFinanceForm loan={loan as ExternalLoan} />
  ) : (
    <InternalFinanceForm loan={loan} />
  )
}

function InternalFinanceForm({ loan }: { loan: LoanType }) {
  const pool = usePool(loan.poolId) as Pool
  const account = useBorrower(loan.poolId, loan.id)
  if (!account) throw new Error('No borrower')
  const { current: availableFinancing } = useAvailableFinancing(loan.poolId, loan.id)
  const { execute: doFinanceTransaction, isLoading: isFinanceLoading } = useCentrifugeTransaction(
    'Finance asset',
    (cent) => cent.pools.financeLoan,
    {
      onSuccess: () => {
        financeForm.resetForm()
      },
    }
  )

  const financeForm = useFormik<FinanceValues>({
    initialValues: {
      amount: '',
      withdraw: undefined,
    },
    onSubmit: (values, actions) => {
      const amount = CurrencyBalance.fromFloat(values.amount, pool.currency.decimals)
      doFinanceTransaction(
        [
          loan.poolId,
          loan.id,
          amount,
          values.withdraw ? { ...values.withdraw, currency: pool.currency.key } : undefined,
        ],
        { account, forceProxyType: 'Borrow' }
      )
      actions.setSubmitting(false)
    },
    validateOnMount: true,
  })

  const financeFormRef = React.useRef<HTMLFormElement>(null)
  useFocusInvalidInput(financeForm, financeFormRef)

  if (loan.status === 'Closed') {
    return null
  }

  const poolReserve = pool?.reserve.available.toDecimal() ?? Dec(0)
  const maturityDatePassed =
    loan?.pricing && 'maturityDate' in loan.pricing && new Date() > new Date(loan.pricing.maturityDate)
  const maxBorrow = poolReserve.lessThan(availableFinancing) ? poolReserve : availableFinancing

  return (
    <Stack as={Card} gap={2} p={2}>
      <Stack>
        {'valuationMethod' in loan.pricing && (
          <Shelf justifyContent="space-between">
            <Text variant="heading3">Available financing</Text>
            {/* availableFinancing needs to be rounded down, b/c onSetMax displays the rounded down value as well */}
            <Text variant="heading3">{formatBalance(roundDown(availableFinancing), pool?.currency.symbol, 2)}</Text>
          </Shelf>
        )}
        <Shelf justifyContent="space-between">
          <Text variant="label1">Total financed</Text>
          <Text variant="label1">{formatBalance(loan.totalBorrowed?.toDecimal() ?? 0, pool?.currency.symbol, 2)}</Text>
        </Shelf>
      </Stack>
      {availableFinancing.greaterThan(0) && !maturityDatePassed && (
        <FormikProvider value={financeForm}>
          <Stack as={Form} gap={2} noValidate ref={financeFormRef}>
            <Field
              name="amount"
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
                    value={field.value instanceof Decimal ? field.value.toNumber() : field.value}
                    label="Amount"
                    errorMessage={meta.touched ? meta.error : undefined}
                    secondaryLabel={`${formatBalance(roundDown(maxBorrow), pool?.currency.symbol, 2)} available`}
                    currency={pool?.currency.symbol}
                    onChange={(value: number) => form.setFieldValue('amount', value)}
                    onSetMax={() => form.setFieldValue('amount', maxBorrow)}
                  />
                )
              }}
            </Field>
            <WithdrawSelect loan={loan} borrower={account} />
            {poolReserve.lessThan(availableFinancing) && (
              <InlineFeedback>
                The pool&apos;s available reserve ({formatBalance(poolReserve, pool?.currency.symbol)}) is smaller than
                the available financing
              </InlineFeedback>
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
  )
}

export function WithdrawSelect({ loan, borrower }: { loan: LoanType; borrower: CombinedSubstrateAccount }) {
  const form = useFormikContext<Pick<FinanceValues, 'withdraw'>>()
  const access = usePoolAccess(loan.poolId)
  const ao = access.assetOriginators.find((a) => a.address === borrower.actingAddress)
  const utils = useCentrifugeUtils()
  const getName = useGetNetworkName()
  const [field, meta, helpers] = useField('withdraw')

  const options = ((ao?.transferAllowlist.filter((l) => !!l.meta && !!l.key) ?? []) as { meta: WithdrawAddress }[]).map(
    ({ meta: { address, location }, meta }) => ({
      label: `${truncateAddress(utils.formatAddress(address))} on ${
        typeof location === 'string'
          ? getName(location as any)
          : 'parachain' in location
          ? parachainNames[location.parachain]
          : getName(location.evm)
      }`,
      value: JSON.stringify(meta),
    })
  )

  React.useEffect(() => {
    if (!ao?.transferAllowlist.length) return
    helpers.setValue(ao.transferAllowlist[0].meta, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ao?.transferAllowlist.length])

  if (!ao?.transferAllowlist.length) return null

  return (
    <Select
      name="withdraw"
      label="Withdraw address"
      onChange={(event) => helpers.setValue(JSON.parse(event.target.value))}
      onBlur={field.onBlur}
      errorMessage={(meta.touched || form.submitCount > 0) && meta.error ? meta.error : undefined}
      value={field.value ? JSON.stringify(field.value) : ''}
      options={options}
      disabled={ao.transferAllowlist.length === 1}
    />
  )
}
