import Centrifuge, {
  AccountCurrencyBalance,
  ActiveLoan,
  CreatedLoan,
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
  Tooltip,
} from '@centrifuge/fabric'
import BN from 'bn.js'
import Decimal from 'decimal.js-light'
import { Field, FieldProps, Form, FormikProvider, useField, useFormik, useFormikContext } from 'formik'
import * as React from 'react'
import { combineLatest, map, of, switchMap } from 'rxjs'
import { parachainIcons, parachainNames } from '../../config'
import { Dec, min } from '../../utils/Decimal'
import { formatBalance } from '../../utils/formatting'
import { useFocusInvalidInput } from '../../utils/useFocusInvalidInput'
import { useAvailableFinancing, useLoans } from '../../utils/useLoans'
import { useBorrower, usePoolAccess } from '../../utils/usePermissions'
import { usePool } from '../../utils/usePools'
import { combine, positiveNumber } from '../../utils/validation'
import { useChargePoolFees } from './ChargeFeesFields'
import { ExternalFinanceForm } from './ExternalFinanceForm'
import { SourceSelect } from './SourceSelect'
import { isCashLoan, isExternalLoan } from './utils'

const TOKENMUX_PALLET_ACCOUNTID = '0x6d6f646c6366672f746d75780000000000000000000000000000000000000000'

type Key = `${'parachain' | 'evm'}:${number}` | 'centrifuge'
type FinanceValues = {
  principal: number | '' | Decimal
  withdraw: undefined | WithdrawAddress
  fees: { id: string; amount: '' | number | Decimal }[]
  category: 'interest' | 'miscellaneous' | undefined
}

const UNLIMITED = Dec(1000000000000000)

export function FinanceForm({ loan }: { loan: LoanType }) {
  const [source, setSource] = React.useState<string>('reserve')

  if (isExternalLoan(loan)) {
    return (
      <Stack gap={2} p={1}>
        <Text variant="heading2">Purchase</Text>
        <SourceSelect loan={loan} value={source} onChange={setSource} action="finance" />
        <ExternalFinanceForm loan={loan as ExternalLoan} source={source} />
      </Stack>
    )
  }

  return (
    <Stack gap={2} p={1}>
      <Text variant="heading2">{isCashLoan(loan) ? 'Deposit' : 'Finance'}</Text>
      <SourceSelect loan={loan} value={source} onChange={setSource} action="finance" />
      <InternalFinanceForm loan={loan} source={source} />
    </Stack>
  )
}

/**
 * Finance form for loans with `valuationMethod: outstandingDebt, discountedCashflow, cash`
 */
function InternalFinanceForm({ loan, source }: { loan: LoanType; source: string }) {
  const pool = usePool(loan.poolId) as Pool
  const account = useBorrower(loan.poolId, loan.id)
  const api = useCentrifugeApi()
  const poolFees = useChargePoolFees(loan.poolId, loan.id)
  const loans = useLoans(loan.poolId)
  const displayCurrency = source === 'reserve' ? pool.currency.symbol : 'USD'

  const { current: availableFinancing } = useAvailableFinancing(loan.poolId, loan.id)
  const sourceLoan = loans?.find((l) => l.id === source) as CreatedLoan | ActiveLoan
  const { execute: doFinanceTransaction, isLoading: isFinanceLoading } = useCentrifugeTransaction(
    isCashLoan(loan) ? 'Deposit funds' : 'Finance asset',
    (cent) => (args: [poolId: string, loanId: string, principal: BN], options) => {
      if (!account) throw new Error('No borrower')
      const [poolId, loanId, principal] = args
      let financeTx
      if (source === 'reserve') {
        financeTx = cent.pools.financeLoan([poolId, loanId, principal], { batch: true })
      } else if (source === 'other') {
        if (!financeForm.values.category) throw new Error('No category selected')
        const increaseDebtTx = api.tx.loans.increaseDebt(poolId, loan.id, { internal: principal })
        const categoryHex = Buffer.from(financeForm.values.category).toString('hex')
        financeTx = cent.remark.remark([[{ Named: categoryHex }], increaseDebtTx], { batch: true })
      } else {
        const repay = { principal, interest: new BN(0), unscheduled: new BN(0) }
        let borrow = { amount: principal }
        financeTx = cent.pools.transferLoanDebt([poolId, sourceLoan.id, loan.id, repay, borrow], { batch: true })
      }
      return combineLatest([financeTx, withdraw.getBatch(financeForm), poolFees.getBatch(financeForm)]).pipe(
        switchMap(([loanTx, withdrawBatch, poolFeesBatch]) => {
          const batch = [...withdrawBatch, ...poolFeesBatch]
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
      principal: '',
      withdraw: undefined,
      fees: [],
      category: 'interest',
    },
    onSubmit: (values, actions) => {
      const principal = CurrencyBalance.fromFloat(values.principal, pool.currency.decimals)
      doFinanceTransaction([loan.poolId, loan.id, principal], {
        account,
        forceProxyType: 'Borrow',
      })
      actions.setSubmitting(false)
    },
    validateOnMount: true,
  })

  const financeFormRef = React.useRef<HTMLFormElement>(null)
  useFocusInvalidInput(financeForm, financeFormRef)

  const withdraw = useWithdraw(loan.poolId, account!, Dec(financeForm.values.principal || 0))

  if (loan.status === 'Closed') {
    return null
  }

  const poolReserve = pool?.reserve.available.toDecimal() ?? Dec(0)
  const maturityDatePassed = loan?.pricing.maturityDate && new Date() > new Date(loan.pricing.maturityDate)
  const totalFinance = Dec(financeForm.values.principal || 0)

  const maxAvailable =
    source === 'reserve'
      ? min(poolReserve, availableFinancing)
      : source === 'other'
      ? UNLIMITED
      : sourceLoan.outstandingDebt.toDecimal()

  return (
    <>
      {!maturityDatePassed && (
        <FormikProvider value={financeForm}>
          <Stack as={Form} gap={2} noValidate ref={financeFormRef}>
            <Field
              name="principal"
              validate={combine(positiveNumber(), (val) => {
                const principalValue = typeof val === 'number' ? Dec(val) : (val as Decimal)
                if (maxAvailable !== UNLIMITED && principalValue.gt(maxAvailable)) {
                  return `Principal exceeds available financing`
                }
                return ''
              })}
            >
              {({ field, form }: FieldProps) => {
                return (
                  <CurrencyInput
                    {...field}
                    value={field.value instanceof Decimal ? field.value.toNumber() : field.value}
                    label={isCashLoan(loan) ? 'Amount' : 'Principal'}
                    currency={displayCurrency}
                    onChange={(value) => form.setFieldValue('principal', value)}
                    onSetMax={
                      maxAvailable !== UNLIMITED ? () => form.setFieldValue('principal', maxAvailable) : undefined
                    }
                  />
                )
              }}
            </Field>
            {source === 'other' && (
              <Field name="category">
                {({ field }: FieldProps) => {
                  return (
                    <Select
                      options={[
                        { label: 'Interest', value: 'interest' },
                        { label: 'Miscellaneous', value: 'miscellaneous' },
                      ]}
                      label="Category"
                      {...field}
                    />
                  )
                }}
              </Field>
            )}
            {source === 'reserve' && withdraw.render()}

            {poolFees.render()}

            {totalFinance.gt(0) && maxAvailable !== UNLIMITED && totalFinance.gt(maxAvailable) && (
              <Box bg="statusCriticalBg" p={1}>
                <InlineFeedback status="critical">
                  <Text color="statusCritical">
                    Available financing ({formatBalance(maxAvailable, displayCurrency, 2)}) is smaller than the total
                    principal ({formatBalance(totalFinance, displayCurrency, 2)}).
                  </Text>
                </InlineFeedback>
              </Box>
            )}

            <Stack p={2} maxWidth="444px" bg="backgroundTertiary" gap={2}>
              <Shelf justifyContent="space-between">
                <Text variant="label2" color="textPrimary">
                  Available balance
                </Text>
                <Text variant="label2">
                  <Tooltip
                    body={
                      maxAvailable === UNLIMITED
                        ? 'Unlimited because this is a virtual accounting process.'
                        : 'Balance of the source asset'
                    }
                    style={{ pointerEvents: 'auto' }}
                  >
                    {maxAvailable === UNLIMITED ? 'No limit' : formatBalance(maxAvailable, displayCurrency, 2)}
                  </Tooltip>
                </Text>
              </Shelf>

              <Stack gap={1}>
                <Shelf justifyContent="space-between">
                  <Text variant="label2" color="textPrimary">
                    Financing amount
                  </Text>
                  <Text variant="label2">{formatBalance(totalFinance, displayCurrency, 2)}</Text>
                </Shelf>
              </Stack>

              {poolFees.renderSummary()}
            </Stack>

            <Box bg="statusDefaultBg" p={1}>
              {source === 'reserve' ? (
                <InlineFeedback status="default">
                  <Text color="statusDefault">
                    Stablecoins will be transferred to the specified withdrawal addresses, on the specified networks. A
                    delay until the transfer is completed is to be expected.
                  </Text>
                </InlineFeedback>
              ) : source === 'other' ? (
                <InlineFeedback status="default">
                  <Text color="statusDefault">
                    Virtual accounting process. No onchain stablecoin transfers are expected. This action will lead to
                    an increase in the NAV of the pool.
                  </Text>
                </InlineFeedback>
              ) : (
                <InlineFeedback status="default">
                  <Text color="statusDefault">
                    Virtual accounting process. No onchain stablecoin transfers are expected.
                  </Text>
                </InlineFeedback>
              )}
            </Box>
            <Stack>
              <Button
                type="submit"
                loading={isFinanceLoading}
                disabled={
                  !financeForm.values.principal ||
                  !withdraw.isValid ||
                  !poolFees.isValid(financeForm) ||
                  !financeForm.isValid ||
                  maxAvailable.eq(0)
                }
              >
                {isCashLoan(loan) ? 'Deposit' : 'Finance'}
              </Button>
            </Stack>
          </Stack>
        </FormikProvider>
      )}
    </>
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

const stringToHex = (str: string) =>
  str
    .split('')
    .map((char) => ('00' + char.charCodeAt(0).toString(16)).slice(-2))
    .join('')
