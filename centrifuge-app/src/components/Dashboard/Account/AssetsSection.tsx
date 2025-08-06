import { ActiveLoan, CurrencyBalance, ExternalLoan, Loan, Pool, TinlakeLoan } from '@centrifuge/centrifuge-js'
import { useCentrifugeApi, useCentrifugeQuery, useCentrifugeTransaction } from '@centrifuge/centrifuge-react'
import { Box, Button, CurrencyInput, Divider, Grid, Stack, Text } from '@centrifuge/fabric'
import { BN } from 'bn.js'
import { Field, FieldProps, Form, FormikProvider, useFormik } from 'formik'
import { useEffect, useMemo, useState } from 'react'
import { combineLatest, of, switchMap } from 'rxjs'
import { DataTable } from '../../../../src/components/DataTable'
import { AssetName, getAmount } from '../../../../src/components/LoanList'
import { isCashLoan, isExternalLoan } from '../../../../src/pages/Loan/utils'
import { Dec } from '../../../../src/utils/Decimal'
import { formatDate } from '../../../../src/utils/date'
import { formatBalance } from '../../../../src/utils/formatting'
import { useActiveDomains } from '../../../../src/utils/useLiquidityPools'
import { usePoolFees } from '../../../../src/utils/usePools'
import { hasValuationMethod } from '../utils'

const MAX_COLLECT = 100

type Row = {
  loan: Loan | TinlakeLoan
  quantity: CurrencyBalance
  currentPrice: CurrencyBalance
  newPrice: number
  newValue: number
}

interface LoanData {
  quantity: number
  currentPrice: number
  newPrice: number
  newValue: number
  id: string
}

type Attestation = {
  portfolio: {
    timestamp: number
    decimals: number
    assets: {
      assetId?: string
      name: string
      quantity: string
      price: string
    }[]
    netAssetValue: string
    tokenSupply: string[]
    tokenPrice: string[]
    tokenAddresses: Record<string, string[]>
  }
  signature?: {
    hash: string
    publicKey: string
  }
}

interface TransactionLoanData {
  formIndex: number
  id: string
  oldValue: number
  value: number
  isin: string
  quantity: number
  withLinearPricing: boolean
  currentPrice: number
}

type FormValues = Record<string, LoanData>

export default function AssetsSection({ pool }: { pool: Pool }) {
  const api = useCentrifugeApi()
  const poolFees = usePoolFees(pool.id)
  const { data: domains } = useActiveDomains(pool.id)
  const [loans, isLoading] = useCentrifugeQuery(
    ['loans', pool.id],
    (cent) => cent.pools.getLoans({ poolIds: [pool.id] }),
    {
      enabled: !!pool.id && !!pool,
    }
  )

  const [update, setUpdate] = useState(false)
  const isTinlakePool = pool.id.startsWith('0x')

  // Needs to update when selecting a new pool
  useEffect(() => {
    setUpdate(false)
  }, [loans])

  const activeLoans = useMemo(
    () =>
      loans?.filter(
        // Filter out loans that are closed or fully repaid
        (l) => l.status !== 'Closed' && (!('presentValue' in l) || !l.presentValue.isZero())
      ) ?? [],
    [loans]
  ) as ActiveLoan[]

  const externalLoans = activeLoans.filter(isExternalLoan) as ExternalLoan[]

  const totalAssets = useMemo(() => {
    return loans?.reduce((sum, loan) => {
      if (hasValuationMethod(loan.pricing) && loan.pricing.valuationMethod !== 'cash') {
        const amount = new CurrencyBalance(getAmount(loan, pool, false, true), pool.currency.decimals).toDecimal()
        return sum.add(amount)
      }
      return sum
    }, Dec(0))
  }, [loans, pool])

  const totalAum = pool.nav.aum.toDecimal().add(pool.reserve.total.toDecimal())

  const initialValues =
    loans?.reduce<Record<string, LoanData>>((acc, loan) => {
      const quantity =
        'outstandingQuantity' in loan.pricing ? loan.pricing.outstandingQuantity.toDecimal().toNumber() : 0
      const currentPrice =
        loan.status === 'Active' ? ('currentPrice' in loan ? loan.currentPrice.toDecimal().toNumber() : 0) : 0

      acc[loan.id] = {
        quantity: 'outstandingQuantity' in loan.pricing ? loan.pricing.outstandingQuantity.toDecimal().toNumber() : 0,
        currentPrice,
        newPrice: currentPrice,
        newValue: quantity * currentPrice,
        id: loan.id,
      }

      return acc
    }, {}) || {}

  const { execute: updateNAV, isLoading: isUpdatingNAV } = useCentrifugeTransaction(
    'Update NAV',
    (cent) => (args: [TransactionLoanData[]], options) => {
      const [values] = args

      const feeds = values
        .filter((f) => typeof f.value === 'number' && !Number.isNaN(f.value))
        .map((f) => {
          const feed = f.isin ? { Isin: f.isin } : { poolloanid: [pool.id, f.id] }
          return api.tx.oraclePriceFeed.feed(feed, CurrencyBalance.fromFloat(f.value, 18))
        })

      const batch = [
        ...feeds,
        api.tx.oraclePriceCollection.updateCollection(pool.id),
        api.tx.loans.updatePortfolioValuation(pool.id),
      ]

      const tx = api.tx.utility.batchAll(batch)
      return cent.wrapSignAndSend(api, tx, options)
    }
  )

  const { execute: updateTokenPrices, isLoading: isUpdatingPrices } = useCentrifugeTransaction(
    'Update token prices',
    (cent) => (_args, options) => {
      const deployed = domains?.filter((d) => d.hasDeployedLp) ?? []

      const updateTokenPrices$ = deployed.flatMap((domain) =>
        Object.entries(domain.liquidityPools).flatMap(([tid, poolsByCurrency]) =>
          domain.currencies
            .filter((cur) => !!poolsByCurrency[cur.address])
            .map((cur) =>
              cent.liquidityPools.updateTokenPrice([pool.id, tid, cur.key, domain.chainId], { batch: true })
            )
        )
      )

      const updates$ = updateTokenPrices$.length ? combineLatest(updateTokenPrices$) : of([])

      return updates$.pipe(
        switchMap((updateTokenPricesTxs) => {
          const tx = api.tx.utility.batchAll(updateTokenPricesTxs)
          return cent.wrapSignAndSend(api, tx, options)
        })
      )
    }
  )

  const form = useFormik<FormValues>({
    initialValues,
    enableReinitialize: true,
    onSubmit: (v) => {
      const values =
        externalLoans?.map((l, i) => {
          let latestOraclePrice = l.pricing.oracle[0]
          l.pricing.oracle.forEach((price) => {
            if (price.timestamp > latestOraclePrice.timestamp) {
              latestOraclePrice = price
            }
          })
          return {
            formIndex: i,
            id: l.id,
            oldValue: latestOraclePrice.value.toFloat(),
            value: v[l.id]?.newPrice ?? 0,
            isin: 'isin' in l.pricing.priceId ? l.pricing.priceId.isin : '',
            quantity: l.pricing.outstandingQuantity.toFloat(),
            withLinearPricing: l.pricing.withLinearPricing,
            currentPrice: l.status === 'Active' ? l?.currentPrice.toDecimal().toNumber() : 0,
          }
        }) ?? []

      updateNAV([values])
    },
  })

  const columns = [
    {
      align: 'left',
      header: isTinlakePool ? 'NFT ID' : 'Asset',
      cell: ({ loan }: Row) => {
        return <AssetName loan={loan} />
      },
    },
    {
      align: 'left',
      header: 'Quantity',
      cell: ({ loan }: Row) => (
        <Text variant="body3">
          {'outstandingQuantity' in loan.pricing ? formatBalance(loan.pricing.outstandingQuantity) : 0}
        </Text>
      ),
    },
    {
      align: 'left',
      header: 'Current price (USDC)',
      cell: ({ currentPrice }: Row) => (
        <Text variant="body3">{currentPrice ? formatBalance(currentPrice, '', 4) : 0}</Text>
      ),
    },
    {
      align: 'left',
      header: 'New price (USDC)',
      cell: ({ loan }: Row) => {
        return (
          <Field name={`${loan.id}.newPrice`}>
            {({ field, form }: FieldProps) => (
              <CurrencyInput
                {...field}
                value={field.value || ''}
                onChange={(value) => {
                  form.setFieldValue(field.name, value)
                  const quantity = form.values[loan.id]?.quantity || 0
                  if (typeof value === 'number') {
                    form.setFieldValue(`${loan.id}.newValue`, value * quantity)
                  }
                }}
                decimals={4}
              />
            )}
          </Field>
        )
      },
    },
    {
      align: 'left',
      header: 'New value (USDC)',
      cell: ({ loan }: Row) => {
        return (
          <Text variant="body3">
            {form.values[loan.id]?.newValue ? formatBalance(form.values[loan.id]?.newValue, '', 4) : 0}
          </Text>
        )
      },
    },
  ]

  const data = useMemo(() => {
    return loans
      ?.map((loan) => ({
        loan,
        quantity: 'outstandingQuantity' in loan.pricing && loan.pricing.outstandingQuantity,
        currentPrice:
          loan.status === 'Active' ? ('currentPrice' in loan ? loan?.currentPrice.toDecimal().toNumber() : 0) : null,
      }))
      .filter((loan) => !isCashLoan(loan.loan))
      .filter((loan) => loan.quantity && !loan.quantity.isZero())
  }, [loans])

  const changeInValuation = useMemo(() => {
    return (externalLoans as ActiveLoan[]).reduce((prev, curr) => {
      const price = curr.currentPrice ? curr.currentPrice.toDecimal() : Dec(0)
      const quantity = (curr as ExternalLoan).pricing.outstandingQuantity.toDecimal()
      const updatedPrice = Dec(form.values[curr.id]?.newPrice || 0)
      return CurrencyBalance.fromFloat(
        prev.toDecimal().add(updatedPrice.sub(price).mul(quantity)).toString(),
        pool.currency.decimals
      )
    }, new CurrencyBalance(0, pool.currency.decimals))
  }, [externalLoans, form.values, pool.currency.decimals])

  // NOTE: current pending here in the app does include both pending + disbursed fees
  const pendingFees = useMemo(() => {
    return new CurrencyBalance(
      poolFees?.map((f) => f.amounts.pending).reduce((acc, f) => acc.add(f), new BN(0)) ?? new BN(0),
      pool.currency.decimals
    )
  }, [poolFees, pool.currency.decimals])

  const pendingNav = totalAum.add(changeInValuation.toDecimal()).sub(pendingFees.toDecimal())

  if (isLoading) return null

  return (
    <FormikProvider value={form}>
      <Form>
        <Box backgroundColor="backgroundSecondary" borderRadius={8} p={2} mt={3}>
          <Box display="flex" justifyContent="space-between">
            <Text variant="heading1">Assets</Text>
            <Text variant="heading1">{totalAssets ? formatBalance(totalAssets) : 0} USDC</Text>
          </Box>
          <Stack
            backgroundColor="backgroundPage"
            borderRadius={8}
            p={2}
            mt={3}
            border="1px solid"
            borderColor="borderPrimary"
            gap={2}
          >
            <Text variant="heading4">Assets prices and NAV</Text>
            <Divider color="borderPrimary" />
            <Grid gridTemplateColumns={['1fr', '1fr 1fr 1fr 1fr 180px 180px']} gap={2}>
              <Stack gap={1}>
                <Text variant="body3">Current NAV</Text>
                <Text variant="heading1">{formatBalance(totalAum, 'USDC', 2)}</Text>
              </Stack>
              <Stack gap={1}>
                <Text variant="body3">Change in valuation</Text>
                <Text variant="heading1">{changeInValuation ? formatBalance(changeInValuation, 'USDC', 2) : 0}</Text>
              </Stack>
              <Stack gap={1}>
                <Text variant="body3">New NAV</Text>
                <Text variant="heading1">{pendingNav ? formatBalance(pendingNav, 'USDC', 2) : 0}</Text>
              </Stack>
              <Stack gap={1}>
                <Text variant="body3">Last updated</Text>
                <Text variant="heading4">{formatDate(pool.nav.lastUpdated)}</Text>
              </Stack>
              {!update && (
                <Button variant="secondary" small onClick={() => setUpdate(true)} disabled={!loans?.length}>
                  Update
                </Button>
              )}
              <Button variant="primary" small onClick={() => updateTokenPrices([])} loading={isUpdatingPrices}>
                Update token prices
              </Button>
            </Grid>
          </Stack>
          {update && (
            <Stack
              backgroundColor="backgroundPage"
              borderRadius={8}
              p={2}
              mt={3}
              border="1px solid"
              borderColor="borderPrimary"
              gap={2}
            >
              <Text variant="heading4">Update assets prices</Text>
              <Divider color="borderPrimary" />
              <DataTable data={data} columns={columns} defaultSortKey="quantity" defaultSortOrder="desc" />
              <Grid gridTemplateColumns="1fr 1fr" gap={2} display="flex" justifyContent="flex-end">
                <Button variant="inverted" small style={{ width: '105px' }} onClick={() => setUpdate(false)}>
                  {' '}
                  Cancel
                </Button>
                <Button
                  small
                  style={{ width: '170px' }}
                  disabled={!form.dirty || isUpdatingNAV}
                  onClick={() => form.submitForm()}
                >
                  Update NAV
                </Button>
              </Grid>
            </Stack>
          )}
        </Box>
      </Form>
    </FormikProvider>
  )
}
