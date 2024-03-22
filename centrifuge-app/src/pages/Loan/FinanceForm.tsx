import {
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
  Grid,
  GridRow,
  InlineFeedback,
  Select,
  Shelf,
  Stack,
  Text,
} from '@centrifuge/fabric'
import BN from 'bn.js'
import Decimal from 'decimal.js-light'
import { Field, FieldProps, Form, FormikProvider, useField, useFormik, useFormikContext } from 'formik'
import * as React from 'react'
import { combineLatest, map, of, switchMap } from 'rxjs'
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

const TOKENMUX_PALLET_ACCOUNTID = '0x6d6f646c6366672f746d75780000000000000000000000000000000000000000'

type Key = `${'parachain' | 'evm'}:${number}`
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
        withdraw.getBatch(),
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
  const maturityDatePassed =
    loan?.pricing && 'maturityDate' in loan.pricing && new Date() > new Date(loan.pricing.maturityDate)
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
  withdrawAddressesByDomain,
  withdrawAmounts,
}: {
  amount: Decimal
  total: Decimal
  withdrawAddressesByDomain: Record<string, WithdrawAddress[]>
  withdrawAmounts: WithdrawBucket[]
}) {
  const utils = useCentrifugeUtils()
  const getName = useGetNetworkName()
  const getIcon = useGetNetworkIcon()

  return (
    <Stack gap={1}>
      <Text variant="body2">Transactions per network</Text>
      <Grid columns={3} rowGap={1}>
        <GridRow borderBottomColor="borderSecondary" borderBottomWidth="1px" borderBottomStyle="solid" pb="4px">
          <Text variant="label2">Amount</Text>
          <Text variant="label2">Address</Text>
          <Text variant="label2">Network</Text>
        </GridRow>
        {!withdrawAmounts.length && (
          <Text variant="body3" color="statusCritical">
            No suitable withdraw addresses
          </Text>
        )}
        {withdrawAmounts.map(({ currency, amount, locationKey }) => {
          const address = withdrawAddressesByDomain[locationKey][0]
          return (
            <GridRow>
              <Text variant="body3">{formatBalance(amount, currency.symbol)}</Text>
              <Text variant="body3">{truncateAddress(utils.formatAddress(address.address))}</Text>
              <Text variant="body3">
                <Shelf gap="4px">
                  <Box
                    as="img"
                    src={getIcon(
                      typeof address.location === 'string'
                        ? address.location
                        : 'parachain' in address.location
                        ? 'centrifuge'
                        : address.location.evm
                    )}
                    alt=""
                    width="iconSmall"
                    height="iconSmall"
                    style={{ objectFit: 'contain' }}
                  />
                  {typeof address.location === 'string'
                    ? getName(address.location as any)
                    : 'parachain' in address.location
                    ? parachainNames[address.location.parachain]
                    : getName(address.location.evm)}
                </Shelf>
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
  const form = useFormikContext<Pick<FinanceValues, 'withdraw'>>()
  const access = usePoolAccess(poolId)
  const muxBalances = useBalances(TOKENMUX_PALLET_ACCOUNTID)
  const cent = useCentrifuge()
  const api = useCentrifugeApi()

  const ao = access.assetOriginators.find((a) => a.address === borrower.actingAddress)
  const withdrawAddresses = ao?.transferAllowlist.map((l) => l.meta) ?? []

  if (!isLocalAsset) {
    if (!withdrawAddresses.length)
      return {
        render: () => null,
        isValid: true,
        getBatch: () => of([]),
      }
    return {
      render: () => <WithdrawSelect withdrawAddresses={withdrawAddresses} />,
      isValid: true,
      getBatch: () => {
        if (!form.values.withdraw) return of([])
        return cent.pools
          .withdraw(
            [
              CurrencyBalance.fromFloat(amount, pool.currency.decimals),
              pool.currency.key,
              form.values.withdraw.address,
              form.values.withdraw.location,
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
  const withdrawAmounts = muxBalances?.currencies
    ? divideBetweenCurrencies(amount, sortedBalances, withdrawAddresses)
    : []
  const totalAvailable = withdrawAmounts.reduce((acc, cur) => acc.add(cur.amount), Dec(0))
  const withdrawAddressesByDomain: Record<string, WithdrawAddress[]> = {}
  withdrawAddresses.forEach((addr) => {
    const key = locationToKey(addr.location)
    if (withdrawAddressesByDomain[key]) {
      withdrawAddressesByDomain[key].push(addr)
    } else {
      withdrawAddressesByDomain[key] = [addr]
    }
  })

  return {
    render: () => (
      <Mux
        withdrawAddressesByDomain={withdrawAddressesByDomain}
        withdrawAmounts={withdrawAmounts}
        total={totalAvailable}
        amount={amount}
      />
    ),
    isValid: amount.lte(totalAvailable),
    getBatch: () => {
      return combineLatest(
        withdrawAmounts.flatMap((bucket) => {
          // TODO: Select specific withdraw address for a domain if there's multiple
          const withdraw = withdrawAddressesByDomain[bucket.locationKey][0]
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
  return Object.entries(location)[0].join(':') as Key
}

type WithdrawBucket = { currency: CurrencyMetadata; amount: Decimal; locationKey: Key }
function divideBetweenCurrencies(
  amount: Decimal,
  balances: AccountCurrencyBalance[],
  withdrawAddresses: WithdrawAddress[],
  result: WithdrawBucket[] = []
) {
  const [next, ...rest] = balances

  if (!next) return result

  const hasAddress = !!withdrawAddresses.find(
    (addr) => locationToKey(addr.location) === locationToKey(getCurrencyLocation(next.currency))
  )
  const key = locationToKey(getCurrencyLocation(next.currency))

  let combinedResult = [...result]
  let remainder = amount
  if (hasAddress) {
    const balanceDec = next.balance.toDecimal()
    if (remainder.lte(balanceDec)) {
      combinedResult.push({ amount: remainder, currency: next.currency, locationKey: key })
      remainder = Dec(0)
    } else {
      remainder = remainder.sub(balanceDec)
      combinedResult.push({ amount: balanceDec, currency: next.currency, locationKey: key })
    }
  }

  return divideBetweenCurrencies(remainder, rest, withdrawAddresses, combinedResult)
}
