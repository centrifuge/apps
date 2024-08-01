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

type Key = `${'parachain' | 'evm'}:${number}`
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
        const tx = api.tx.loans.increaseDebt(poolId, loan.id, { internal: principal })
        const categoryHex = Buffer.from(financeForm.values.category).toString('hex')
        financeTx = cent.wrapSignAndSend(api, api.tx.remarks.remark([{ Named: categoryHex }], tx), { batch: true })
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
      {maxAvailable.greaterThan(0) && !maturityDatePassed && (
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
                    currency={pool?.currency.symbol}
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
            <Box bg="statusDefaultBg" p={1}>
              {source === 'reserve' ? (
                <InlineFeedback status="default">
                  <Text color="statusDefault">
                    Stablecoins will be transferred to the specified withdrawal addresses, on the specified networks. A
                    delay until the transfer is completed is to be expected.
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
            {poolFees.render()}
            {poolReserve.lessThan(availableFinancing) && loan.pricing.valuationMethod !== 'cash' && (
              <Box bg="statusWarningBg">
                <InlineFeedback status="warning">
                  <Text color="statusWarning">
                    The pool&apos;s available reserve ({formatBalance(poolReserve, pool?.currency.symbol)}) is smaller
                    than the available financing
                  </Text>
                </InlineFeedback>
              </Box>
            )}
            <Shelf justifyContent="space-between">
              <Text variant="emphasized">Total amount</Text>
              <Text variant="emphasized">{formatBalance(totalFinance, pool?.currency.symbol, 2)}</Text>
            </Shelf>

            {poolFees.renderSummary()}

            <Shelf justifyContent="space-between">
              <Text variant="emphasized">Available</Text>
              <Text variant="emphasized">
                {maxAvailable === UNLIMITED ? 'No limit' : formatBalance(maxAvailable, pool?.currency.symbol, 2)}
              </Text>
            </Shelf>
            {totalFinance.gt(0) && maxAvailable !== UNLIMITED && totalFinance.gt(maxAvailable) && (
              <Box bg="statusCriticalBg" p={1}>
                <InlineFeedback status="critical">
                  <Text color="statusCritical">
                    Available financing ({formatBalance(maxAvailable, pool?.currency.symbol, 2)}) is smaller than the
                    total principal ({formatBalance(totalFinance, pool.currency.symbol)}).
                  </Text>
                </InlineFeedback>
              </Box>
            )}
            <Stack>
              <Button
                type="submit"
                loading={isFinanceLoading}
                disabled={
                  !financeForm.values.principal ||
                  !withdraw.isValid ||
                  !poolFees.isValid(financeForm) ||
                  !financeForm.isValid
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
        {withdrawAmounts.map(({ currency, amount, locationKey }) => {
          const address = withdrawAddressesByDomain[locationKey][0]
          return (
            <GridRow>
              <Text variant="body3">{formatBalance(amount, currency.displayName)}</Text>
              <Text variant="body3">{truncateAddress(utils.formatAddress(address.address))}</Text>
              <Text variant="body3">
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
  const access = usePoolAccess(poolId)
  const muxBalances = useBalances(TOKENMUX_PALLET_ACCOUNTID)
  const cent: Centrifuge = useCentrifuge()
  const api = useCentrifugeApi()

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
