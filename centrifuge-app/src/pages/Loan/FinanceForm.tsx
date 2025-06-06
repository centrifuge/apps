import Centrifuge, {
  AccountCurrencyBalance,
  ActiveLoan,
  CreatedLoan,
  CurrencyBalance,
  CurrencyMetadata,
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
import { useTheme } from 'styled-components'
import { AnchorTextLink, RouterTextLink } from '../../components/TextLink'
import { parachainIcons, parachainNames } from '../../config'
import { Dec, min } from '../../utils/Decimal'
import { formatBalance } from '../../utils/formatting'
import { useFocusInvalidInput } from '../../utils/useFocusInvalidInput'
import { useAvailableFinancing, useLoans } from '../../utils/useLoans'
import { useBorrower, usePoolAccess } from '../../utils/usePermissions'
import { usePool } from '../../utils/usePools'
import { combine, positiveNumber } from '../../utils/validation'
import { useChargePoolFees } from './ChargeFeesFields'
import { ErrorMessage } from './ErrorMessage'
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
    return <ExternalFinanceForm loan={loan} source={source} setSource={setSource} />
  }

  return <InternalFinanceForm loan={loan} source={source} onChange={setSource} />
}

/**
 * Finance form for loans with `valuationMethod: outstandingDebt, discountedCashflow, cash`
 */
function InternalFinanceForm({
  loan,
  source,
  onChange,
}: {
  loan: LoanType
  source: string
  onChange: (source: string) => void
}) {
  const theme = useTheme()
  const pool = usePool(loan.poolId) as Pool
  const account = useBorrower(loan.poolId, loan.id)
  const api = useCentrifugeApi()
  const poolFees = useChargePoolFees(loan.poolId, loan.id)
  const { data: loans } = useLoans([loan.poolId])
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
        const encoded = new TextEncoder().encode(financeForm.values.category)
        const categoryHex = Array.from(encoded)
          .map((byte) => byte.toString(16).padStart(2, '0'))
          .join('')
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

  React.useEffect(() => {
    financeForm.validateForm()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source])

  const financeFormRef = React.useRef<HTMLFormElement>(null)
  useFocusInvalidInput(financeForm, financeFormRef)

  const withdraw = useWithdraw(loan.poolId, account!, Dec(financeForm.values.principal || 0), source)

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
            <Box
              px={3}
              py={2}
              backgroundColor={theme.colors.backgroundSecondary}
              borderRadius={10}
              border={`1px solid ${theme.colors.borderPrimary}`}
            >
              <Stack gap={2}>
                <SourceSelect loan={loan} value={source} onChange={onChange} action="finance" />
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
                            { label: 'Correction', value: 'correction' },
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

                <ErrorMessage
                  type="critical"
                  condition={totalFinance.gt(0) && maxAvailable !== UNLIMITED && totalFinance.gt(maxAvailable)}
                >
                  {isCashLoan(loan) ? 'Deposit amount' : 'Financing amount'} (
                  {formatBalance(totalFinance, displayCurrency, 2)}) is greater than the available balance (
                  {formatBalance(maxAvailable, displayCurrency, 2)}).
                </ErrorMessage>

                <ErrorMessage
                  type="default"
                  condition={
                    source === 'reserve' &&
                    totalFinance.gt(maxAvailable) &&
                    pool.reserve.total.gt(pool.reserve.available)
                  }
                >
                  There is an additional{' '}
                  {formatBalance(
                    new CurrencyBalance(pool.reserve.total.sub(pool.reserve.available), pool.currency.decimals),
                    displayCurrency
                  )}{' '}
                  available from repayments or deposits. This requires first executing the orders on the{' '}
                  <AnchorTextLink href={`#/pools/${pool.id}/liquidity`}>Liquidity tab</AnchorTextLink>.
                </ErrorMessage>
              </Stack>
            </Box>

            <Stack gap={2} border={`1px solid ${theme.colors.borderPrimary}`} px={3} py={2} borderRadius={10}>
              <Text variant="heading4">Transaction summary</Text>
              <Box>
                <Stack gap={1} mb={3}>
                  <Shelf justifyContent="space-between">
                    <Tooltip
                      body={
                        maxAvailable === UNLIMITED
                          ? 'Unlimited because this is a virtual accounting process.'
                          : `Balance of the ${source === 'reserve' ? 'onchain reserve' : 'source asset'}.`
                      }
                      style={{ pointerEvents: 'auto' }}
                    >
                      <Text variant="body2" color="textSecondary">
                        Available balance
                      </Text>
                    </Tooltip>
                    <Text variant="heading4">
                      {maxAvailable === UNLIMITED ? 'No limit' : formatBalance(maxAvailable, displayCurrency, 2)}
                    </Text>
                  </Shelf>
                </Stack>

                <Stack gap={1}>
                  <Shelf justifyContent="space-between">
                    <Tooltip
                      body={
                        maxAvailable === UNLIMITED
                          ? 'Unlimited because this is a virtual accounting process.'
                          : `Balance of the ${source === 'reserve' ? 'onchain reserve' : 'source asset'}.`
                      }
                      style={{ pointerEvents: 'auto' }}
                    >
                      <Text variant="body2" color="textSecondary">
                        Available balance
                      </Text>
                    </Tooltip>
                    <Text variant="heading4">
                      {maxAvailable === UNLIMITED ? 'No limit' : formatBalance(maxAvailable, displayCurrency, 2)}
                    </Text>
                  </Shelf>

                  <Stack gap={1}>
                    <Shelf justifyContent="space-between">
                      <Text variant="body2" color="textSecondary">
                        {isCashLoan(loan) ? 'Deposit amount' : 'Financing amount'}
                      </Text>
                      <Text variant="heading4">{formatBalance(totalFinance, displayCurrency, 2)}</Text>
                    </Shelf>
                  </Stack>

                  {poolFees.renderSummary()}
                </Stack>

                <Stack mt={3}>
                  {source === 'reserve' ? (
                    <InlineFeedback status="default">
                      <Text variant="body2" color="statusDefault">
                        Stablecoins will be transferred to the designated withdrawal addresses on the specified
                        networks. A delay may occur before the transfer is completed.
                      </Text>
                    </InlineFeedback>
                  ) : source === 'other' ? (
                    <InlineFeedback status="default">
                      <Text variant="body2" color="statusDefault">
                        Virtual accounting process. No onchain stablecoin transfers are expected. This action will lead
                        to an increase in the NAV of the pool.
                      </Text>
                    </InlineFeedback>
                  ) : (
                    <InlineFeedback status="default">
                      <Text variant="body2" color="statusDefault">
                        Virtual accounting process. No onchain stablecoin transfers are expected.
                      </Text>
                    </InlineFeedback>
                  )}
                </Stack>
              </Box>
            </Stack>

            <Stack>
              <Button
                type="submit"
                loading={isFinanceLoading}
                disabled={
                  !financeForm.values.principal ||
                  !withdraw.isValid(financeForm) ||
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

function WithdrawSelect({ withdrawAddresses, poolId }: { withdrawAddresses: WithdrawAddress[]; poolId: string }) {
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

  if (!withdrawAddresses.length)
    return (
      <ErrorMessage type="warning" condition={!withdrawAddresses.length}>
        <Stack gap={1}>
          To purchase/finance this asset, the pool must set trusted withdrawal addresses to which funds will be sent.
          <RouterTextLink to={`/issuer/${poolId}/access`}>Add trusted addresses</RouterTextLink>
        </Stack>
      </ErrorMessage>
    )

  return (
    <>
      <Text variant="heading4">Withdrawal address</Text>
      <Select
        name="withdraw"
        onChange={(event) => helpers.setValue(JSON.parse(event.target.value))}
        onBlur={field.onBlur}
        errorMessage={(meta.touched || form.submitCount > 0) && meta.error ? meta.error : undefined}
        value={field.value ? JSON.stringify(field.value) : ''}
        options={options}
        disabled={withdrawAddresses.length === 1}
      />
    </>
  )
}

function Mux({
  withdrawAmounts,
  selectedAddressIndexByCurrency,
  setSelectedAddressIndex,
  poolId,
}: {
  amount: Decimal
  total: Decimal
  poolId: string
  withdrawAmounts: WithdrawBucket[]
  selectedAddressIndexByCurrency: Record<string, number>
  setSelectedAddressIndex: (currency: string, index: number) => void
}) {
  const utils = useCentrifugeUtils()
  const getName = useGetNetworkName()
  const getIcon = useGetNetworkIcon()
  return (
    <Stack gap={1}>
      {!withdrawAmounts.length ? (
        <ErrorMessage type="warning" condition={!withdrawAmounts.length}>
          <Stack gap={1}>
            To purchase/finance this asset, the pool must set trusted withdrawal addresses to which funds will be sent.
            <RouterTextLink to={`/issuer/${poolId}/access`}>Add trusted addresses</RouterTextLink>
          </Stack>
        </ErrorMessage>
      ) : (
        <>
          <Text variant="body2">Transactions per network</Text>
          <Grid columns={3} rowGap={1}>
            <GridRow borderBottomColor="borderPrimary" borderBottomWidth="1px" borderBottomStyle="solid" pb="4px">
              <Text variant="label2">Amount</Text>
              <Text variant="label2">Address</Text>
              <Text variant="label2">Network</Text>
            </GridRow>
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
                        onChange={(event) => {
                          setSelectedAddressIndex(currencyKey, parseInt(event.target.value))
                        }}
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
        </>
      )}
    </Stack>
  )
}

export function useWithdraw(poolId: string, borrower: CombinedSubstrateAccount, amount: Decimal, source: string) {
  const pool = usePool(poolId)
  const isLocalAsset = typeof pool.currency.key !== 'string' && 'LocalAsset' in pool.currency.key
  const access = usePoolAccess(poolId)
  const muxBalances = useBalances(TOKENMUX_PALLET_ACCOUNTID)
  const cent: Centrifuge = useCentrifuge()
  const api = useCentrifugeApi()
  const [selectedAddressIndexByCurrency, setSelectedAddressIndexByCurrency] = React.useState<Record<string, number>>({})

  const ao = access.assetOriginators.find((a) => a.address === borrower.actingAddress)
  const withdrawAddresses = ao?.transferAllowlist ?? []

  const sortedBalances = sortBalances(muxBalances?.currencies || [], pool.currency)
  const ignoredCurrencies = Object.entries(selectedAddressIndexByCurrency).flatMap(([key, index]) => {
    return index === -1 ? [key] : []
  })
  const { buckets: withdrawAmounts } = muxBalances?.currencies
    ? divideBetweenCurrencies(amount, sortedBalances, withdrawAddresses, ignoredCurrencies)
    : { buckets: [] }

  const totalAvailable = withdrawAmounts.reduce((acc, cur) => acc.add(cur.amount), Dec(0))

  React.useEffect(() => {
    if (withdrawAddresses.length > 0 && sortedBalances.length > 0) {
      const initialSelectedAddresses: Record<string, number> = {}
      sortedBalances.forEach((balance) => {
        const currencyKey = currencyToString(balance.currency.key)
        if (!(currencyKey in initialSelectedAddresses)) {
          initialSelectedAddresses[currencyKey] = 0
        }
      })
      setSelectedAddressIndexByCurrency(initialSelectedAddresses)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [withdrawAddresses])

  if (!isLocalAsset) {
    return {
      render: () => <WithdrawSelect withdrawAddresses={withdrawAddresses} poolId={poolId} />,
      isValid: ({ values }: { values: Pick<FinanceValues, 'withdraw'> }) => {
        return source === 'reserve' ? !!values.withdraw : true
      },
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

  return {
    render: () => (
      <Mux
        poolId={poolId}
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
    isValid: () => {
      const withdrawalAddresses = Object.values(selectedAddressIndexByCurrency).filter((index) => index !== -1)
      return source === 'reserve' ? amount.lte(totalAvailable) && !!withdrawalAddresses.length : true
    },
    getBatch: () => {
      const withdrawalAddresses = Object.values(selectedAddressIndexByCurrency).filter((index) => index !== -1)
      if (!withdrawalAddresses.length) return of([])
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
