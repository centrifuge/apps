import Centrifuge, {
  AccountCurrencyBalance,
  CurrencyBalance,
  CurrencyMetadata,
  ExternalLoan,
  Loan as LoanType,
  Pool,
  WithdrawAddress,
  getCurrencyLocation,
} from '@centrifuge/centrifuge-js'
import {
  CombinedSubstrateAccount,
  truncateAddress,
  useBalances,
  useCentrifuge,
  useCentrifugeApi,
  useCentrifugeTransaction,
  useCentrifugeUtils,
  useGetNetworkIcon,
  useGetNetworkName,
  wrapProxyCallsForAccount,
} from '@centrifuge/centrifuge-react'
import {
  Box,
  Button,
  Card,
  CurrencyInput,
  Flex,
  Grid,
  GridRow,
  InlineFeedback,
  Select,
  SelectInner,
  Shelf,
  Stack,
  Text,
} from '@centrifuge/fabric'
import BN from 'bn.js'
import Decimal from 'decimal.js-light'
import { Field, FieldProps, Form, FormikProvider, useField, useFormik, useFormikContext } from 'formik'
import * as React from 'react'
import { combineLatest, map, of, switchMap } from 'rxjs'
import { parachainIcons, parachainNames } from '../../config'
import { Dec } from '../../utils/Decimal'
import { formatBalance, roundDown } from '../../utils/formatting'
import { useFocusInvalidInput } from '../../utils/useFocusInvalidInput'
import { useAvailableFinancing } from '../../utils/useLoans'
import { useBorrower, usePoolAccess } from '../../utils/usePermissions'
import { usePool } from '../../utils/usePools'
import { combine, max, positiveNumber } from '../../utils/validation'
import { ExternalFinanceForm } from './ExternalFinanceForm'
import { isExternalLoan } from './utils'

const TOKENMUX_PALLET_ACCOUNTID = '0x6d6f646c6366672f746d75780000000000000000000000000000000000000000'

type Key = `${'parachain' | 'evm'}:${number}` | 'centrifuge'
type FinanceValues = {
  amount: number | '' | Decimal
  withdraw: undefined | WithdrawAddress
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
  const api = useCentrifugeApi()
  if (!account) throw new Error('No borrower')

  const { current: availableFinancing } = useAvailableFinancing(loan.poolId, loan.id)

  const { execute: doFinanceTransaction, isLoading: isFinanceLoading } = useCentrifugeTransaction(
    'Finance asset',
    (cent) => (args: [poolId: string, loanId: string, amount: BN], options) => {
      const [poolId, loanId, amount] = args
      return combineLatest([
        cent.pools.financeLoan([poolId, loanId, amount], { batch: true }),
        withdraw.getBatch(financeForm),
      ]).pipe(
        switchMap(([loanTx, batch]) => {
          let tx = wrapProxyCallsForAccount(api, loanTx, account, 'Borrow')
          if (batch.length) {
            tx = api.tx.utility.batchAll([tx, ...batch])
          }
          return cent.wrapSignAndSend(api, tx, { ...options, proxies: undefined })
        })
      )
    },
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
      doFinanceTransaction([loan.poolId, loan.id, amount], { account, forceProxyType: 'Borrow' })
      actions.setSubmitting(false)
    },
    validateOnMount: true,
  })

  const financeFormRef = React.useRef<HTMLFormElement>(null)
  useFocusInvalidInput(financeForm, financeFormRef)

  const withdraw = useWithdraw(loan.poolId, account, Dec(financeForm.values.amount || 0))

  if (loan.status === 'Closed') {
    return null
  }

  const poolReserve = pool?.reserve.available.toDecimal() ?? Dec(0)
  const maturityDatePassed = loan?.pricing.maturityDate && new Date() > new Date(loan.pricing.maturityDate)
  const maxBorrow = poolReserve.lessThan(availableFinancing) ? poolReserve : availableFinancing

  return (
    <Stack as={Card} gap={2} p={2}>
      <Stack>
        {'valuationMethod' in loan.pricing && loan.pricing.valuationMethod !== 'cash' && (
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
                    onChange={(value) => form.setFieldValue('amount', value)}
                    onSetMax={() => form.setFieldValue('amount', maxBorrow)}
                  />
                )
              }}
            </Field>
            {withdraw.render()}
            {poolReserve.lessThan(availableFinancing) && loan.pricing.valuationMethod !== 'cash' && (
              <InlineFeedback>
                The pool&apos;s available reserve ({formatBalance(poolReserve, pool?.currency.symbol)}) is smaller than
                the available financing
              </InlineFeedback>
            )}
            <Stack px={1}>
              <Button type="submit" loading={isFinanceLoading} disabled={!withdraw.isValid}>
                Finance asset
              </Button>
            </Stack>
          </Stack>
        </FormikProvider>
      )}
    </Stack>
  )
}

function WithdrawSelect({ withdrawAddresses }: { withdrawAddresses: WithdrawAddress[] }) {
  const form = useFormikContext<Pick<FinanceValues, 'withdraw'>>()
  const utils = useCentrifugeUtils()
  const getName = useGetNetworkName()
  const [field, meta, helpers] = useField('withdraw')

  const options = withdrawAddresses.map((meta) => ({
    label: `${truncateAddress(utils.formatAddress(meta.address))} on ${
      typeof meta.location === 'string'
        ? getName(meta.location as any)
        : 'parachain' in meta.location
        ? parachainNames[meta.location.parachain]
        : getName(meta.location.evm)
    }`,
    value: JSON.stringify(meta),
  }))

  React.useEffect(() => {
    if (!withdrawAddresses.length) return
    helpers.setValue(withdrawAddresses[0], false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [withdrawAddresses.length])

  if (!withdrawAddresses.length) return null

  return (
    <Select
      name="withdraw"
      label="Withdrawal address"
      onChange={(event) => helpers.setValue(JSON.parse(event.target.value))}
      onBlur={field.onBlur}
      errorMessage={(meta.touched || form.submitCount > 0) && meta.error ? meta.error : undefined}
      value={field.value ? JSON.stringify(field.value) : ''}
      options={options}
      disabled={withdrawAddresses.length === 1}
    />
  )
}

function Mux({
  withdrawAmounts,
  selectedAddressIndexByCurrency,
  setSelectedAddressIndex,
}: {
  amount: Decimal
  total: Decimal
  withdrawAmounts: WithdrawBucket[]
  selectedAddressIndexByCurrency: Record<string, number>
  setSelectedAddressIndex: (currency: string, index: number) => void
}) {
  const utils = useCentrifugeUtils()
  const getName = useGetNetworkName()
  const getIcon = useGetNetworkIcon()
  return (
    <Stack gap={1}>
      <Text variant="body2">Transactions per network</Text>
      <Grid columns={3} rowGap={1}>
        <GridRow borderBottomColor="borderPrimary" borderBottomWidth="1px" borderBottomStyle="solid" pb="4px">
          <Text variant="label2">Amount</Text>
          <Text variant="label2">Address</Text>
          <Text variant="label2">Network</Text>
        </GridRow>
        {!withdrawAmounts.length && (
          <Text variant="body3" color="statusCritical">
            No suitable withdraw addresses
          </Text>
        )}
        {withdrawAmounts.map(({ currency, amount, addresses, currencyKey }) => {
          const index = selectedAddressIndexByCurrency[currencyKey] ?? 0
          const address = addresses.at(index >>> 0) // undefined when index is -1
          return (
            <GridRow>
              <Text variant="body3">{formatBalance(amount, currency.symbol)}</Text>
              <Text variant="body3">
                <Flex pr={1}>
                  <SelectInner
                    options={[
                      { label: 'Ignore', value: '-1' },
                      ...addresses.map((addr, index) => ({
                        label: truncateAddress(utils.formatAddress(addr.address)),
                        value: index.toString(),
                      })),
                    ]}
                    value={index.toString()}
                    onChange={(event) => setSelectedAddressIndex(currencyKey, parseInt(event.target.value))}
                    small
                  />
                </Flex>
              </Text>
              <Text variant="body3">
                {address && (
                  <Shelf gap="4px">
                    <Box
                      as="img"
                      src={
                        typeof address.location !== 'string' && 'parachain' in address.location
                          ? parachainIcons[address.location.parachain]
                          : getIcon(typeof address.location === 'string' ? address.location : address.location.evm)
                      }
                      alt=""
                      width="iconSmall"
                      height="iconSmall"
                      style={{ objectFit: 'contain' }}
                      bleedY="4px"
                    />
                    {typeof address.location === 'string'
                      ? getName(address.location as any)
                      : 'parachain' in address.location
                      ? parachainNames[address.location.parachain]
                      : getName(address.location.evm)}
                  </Shelf>
                )}
              </Text>
            </GridRow>
          )
        })}
      </Grid>
    </Stack>
  )
}

export function useWithdraw(poolId: string, borrower: CombinedSubstrateAccount, amount: Decimal) {
  const pool = usePool(poolId)
  const isLocalAsset = typeof pool.currency.key !== 'string' && 'LocalAsset' in pool.currency.key
  const access = usePoolAccess(poolId)
  const muxBalances = useBalances(TOKENMUX_PALLET_ACCOUNTID)
  const cent: Centrifuge = useCentrifuge()
  const api = useCentrifugeApi()
  const [selectedAddressIndexByCurrency, setSelectedAddressIndexByCurrency] = React.useState<Record<string, number>>({})

  const ao = access.assetOriginators.find((a) => a.address === borrower.actingAddress)
  const withdrawAddresses = ao?.transferAllowlist ?? []

  if (!isLocalAsset || !withdrawAddresses.length) {
    if (!withdrawAddresses.length)
      return {
        render: () => null,
        isValid: true,
        getBatch: () => of([]),
      }
    return {
      render: () => <WithdrawSelect withdrawAddresses={withdrawAddresses} />,
      isValid: true,
      getBatch: ({ values }: { values: Pick<FinanceValues, 'withdraw'> }) => {
        if (!values.withdraw) return of([])
        return cent.pools
          .withdraw(
            [
              CurrencyBalance.fromFloat(amount, pool.currency.decimals),
              pool.currency.key,
              values.withdraw.address,
              values.withdraw.location,
            ],
            { batch: true }
          )
          .pipe(
            map((tx) => {
              return [wrapProxyCallsForAccount(api, tx, borrower, 'Transfer')]
            })
          )
      },
    }
  }

  const sortedBalances = sortBalances(muxBalances?.currencies || [], pool.currency)
  const ignoredCurrencies = Object.entries(selectedAddressIndexByCurrency).flatMap(([key, index]) => {
    return index === -1 ? [key] : []
  })
  const { buckets: withdrawAmounts } = muxBalances?.currencies
    ? divideBetweenCurrencies(amount, sortedBalances, withdrawAddresses, ignoredCurrencies)
    : { buckets: [] }

  const totalAvailable = withdrawAmounts.reduce((acc, cur) => acc.add(cur.amount), Dec(0))

  return {
    render: () => (
      <Mux
        withdrawAmounts={withdrawAmounts}
        selectedAddressIndexByCurrency={selectedAddressIndexByCurrency}
        setSelectedAddressIndex={(currencyKey, index) => {
          setSelectedAddressIndexByCurrency((prev) => ({
            ...prev,
            [currencyToString(currencyKey)]: index,
          }))
        }}
        total={totalAvailable}
        amount={amount}
      />
    ),
    isValid: amount.lte(totalAvailable),
    getBatch: () => {
      return combineLatest(
        withdrawAmounts.flatMap((bucket) => {
          const index = selectedAddressIndexByCurrency[bucket.currencyKey] ?? 0
          const withdraw = bucket.addresses[index]
          if (bucket.amount.isZero()) return []
          return [
            of(
              wrapProxyCallsForAccount(
                api,
                api.tx.tokenMux.burn(
                  bucket.currency.key,
                  CurrencyBalance.fromFloat(bucket.amount, bucket.currency.decimals)
                ),
                borrower,
                'Borrow'
              )
            ),
            cent.pools
              .withdraw(
                [
                  CurrencyBalance.fromFloat(bucket.amount, bucket.currency.decimals),
                  bucket.currency.key,
                  withdraw.address,
                  withdraw.location,
                ],
                { batch: true }
              )
              .pipe(map((tx) => wrapProxyCallsForAccount(api, tx, borrower, 'Transfer'))),
          ]
        })
      )
    },
  }
}

// Balances of the tokenMux pallet get sorted with the cheapest network first
const order: Record<string, number> = {
  'evm:8453': 5,
  'evm:84531': 5,
  'parachain:1000': 4,
  'parachain:1001': 4,
  'parachain:2000': 4,
  'evm:42220': 3,
  'evm:44787': 3,
  'evm:42161': 2,
  'evm:421613': 2,
}

function sortBalances(balances: AccountCurrencyBalance[], localPoolCurrency: CurrencyMetadata) {
  const localAssetId = String((localPoolCurrency.key as any).LocalAsset)

  return balances
    .filter(
      (bal) =>
        typeof getCurrencyLocation(bal.currency) !== 'string' &&
        String(bal.currency.additional?.localRepresentation) === localAssetId
    )
    .sort(
      (a, b) =>
        (order[locationToKey(getCurrencyLocation(b.currency))] ?? 0) -
        (order[locationToKey(getCurrencyLocation(a.currency))] ?? 0)
    )
}

function locationToKey(location: WithdrawAddress['location']) {
  return typeof location === 'string' ? location : (Object.entries(location)[0].join(':') as Key)
}

function currencyToString(currencyKey: CurrencyMetadata['key']) {
  return JSON.stringify(currencyKey).replace(/"/g, '')
}

type WithdrawBucket = {
  currency: CurrencyMetadata
  amount: Decimal
  locationKey: Key
  currencyKey: string
  addresses: WithdrawAddress[]
}
function divideBetweenCurrencies(
  amount: Decimal,
  balances: AccountCurrencyBalance[],
  withdrawAddresses: WithdrawAddress[],
  ignoredCurrencies: string[],
  result: WithdrawBucket[] = []
) {
  const [next, ...rest] = balances

  if (!next) {
    return {
      buckets: result,
      remainder: amount,
    }
  }

  const addresses = withdrawAddresses.filter((addr) =>
    [locationToKey(getCurrencyLocation(next.currency)), 'centrifuge'].includes(locationToKey(addr.location))
  )
  const key = locationToKey(getCurrencyLocation(next.currency))

  let combinedResult = [...result]
  let remainder = amount
  if (addresses.length) {
    const balanceDec = next.balance.toDecimal()
    let obj = {
      currency: next.currency,
      locationKey: key,
      addresses,
      currencyKey: currencyToString(next.currency.key),
    }
    if (ignoredCurrencies.includes(obj.currencyKey)) {
      combinedResult.push({
        amount: Dec(0),
        ...obj,
      })
    } else if (remainder.lte(balanceDec)) {
      combinedResult.push({
        amount: remainder,
        ...obj,
      })
      remainder = Dec(0)
    } else {
      remainder = remainder.sub(balanceDec)
      combinedResult.push({
        amount: balanceDec,
        ...obj,
      })
    }
  }

  return divideBetweenCurrencies(remainder, rest, withdrawAddresses, ignoredCurrencies, combinedResult)
}
