import { CurrencyBalance, Loan, Pool, TinlakeLoan } from '@centrifuge/centrifuge-js'
import { useCentrifugeApi, useCentrifugeQuery } from '@centrifuge/centrifuge-react'
import { Card, Stack, Text } from '@centrifuge/fabric'
import { toUtf8String } from 'ethers'
import { first, map } from 'rxjs'
import { Tooltips } from '../../components/Tooltips'
import { formatDate, getAge } from '../../utils/date'
import { formatBalance, formatPercentage } from '../../utils/formatting'
import { TinlakePool } from '../../utils/tinlake/useTinlakePools'
import { useAvailableFinancing } from '../../utils/useLoans'
import { MetricsTable } from './MetricsTable'

type Props = {
  loan: Loan | TinlakeLoan
  pool: Pool | TinlakePool
}

export function PricingValues({ loan, pool }: Props) {
  const { pricing } = loan
  const { current: availableFinancing } = useAvailableFinancing(loan.poolId, loan.id)
  const api = useCentrifugeApi()

  const [oracleCollection] = useCentrifugeQuery(['oracleCollection', pool.id], () =>
    api.query.oraclePriceCollection.collection(pool.id).pipe(
      first(),
      map((data) => {
        const info = data.toPrimitive() as any
        const currentAssetPrice = Object.entries(info.content)
          .filter(([key]) => {
            if ('priceId' in pricing && 'isin' in pricing.priceId) {
              return toUtf8String(JSON.parse(key).isin) === pricing.priceId.isin
            } else {
              return JSON.parse(key).poolLoanId[1].toString() === loan.id.toString()
            }
          })
          .map(([_, value]: [string, any]) => {
            return value[0] // current price
          })
        return {
          value: CurrencyBalance.fromFloat(currentAssetPrice?.[0] ?? 0, pool.currency.decimals),
          timestamp: info.lastUpdated,
        }
      })
    )
  )

  const isOutstandingDebtOrDiscountedCashFlow =
    'valuationMethod' in pricing &&
    (pricing.valuationMethod === 'outstandingDebt' || pricing.valuationMethod === 'discountedCashFlow')

  if ('valuationMethod' in pricing && pricing.valuationMethod === 'oracle') {
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)
    const latestPrice = oracleCollection || { value: new CurrencyBalance(0, pool.currency.decimals), timestamp: 0 }

    const days = latestPrice.timestamp > 0 ? getAge(new Date(latestPrice.timestamp).toISOString()) : undefined
    const priceLastUpdated = days && days.includes('0') ? 'Today' : `${days} ago`

    const accruedPrice = 'currentPrice' in loan && loan.currentPrice

    return (
      <Card p={3}>
        <Stack gap={2}>
          <Text variant="heading4">Pricing</Text>
          <MetricsTable
            metrics={[
              ...('isin' in pricing.priceId ? [{ label: 'ISIN', value: pricing.priceId.isin }] : []),
              {
                label: `Current price${latestPrice.value.isZero() && latestPrice ? ' (settlement)' : ''}`,
                value: accruedPrice
                  ? `${formatBalance(accruedPrice || latestPrice, pool.currency.symbol, 6, 2)}`
                  : latestPrice
                  ? `${formatBalance(latestPrice.value, pool.currency.symbol, 6, 2)}`
                  : '-',
              },
              {
                label: <Tooltips type="linearAccrual" size="med" />,
                value: pricing.withLinearPricing ? 'Enabled' : 'Disabled',
              },
              ...(loan.status === 'Active' && loan.outstandingDebt.toDecimal().lte(0)
                ? []
                : !pricing.withLinearPricing
                ? [{ label: 'Price last updated', value: priceLastUpdated }]
                : [{ label: 'Last manual price update', value: priceLastUpdated }]),
              ...(pricing.interestRate.gtn(0)
                ? [
                    {
                      label: 'Interest rate',
                      value: pricing.interestRate && formatPercentage(pricing.interestRate.toPercent()),
                    },
                  ]
                : []),
            ]}
          />
        </Stack>
      </Card>
    )
  }

  return (
    <Card p={3}>
      <Stack gap={2}>
        <Text variant="heading4">Pricing</Text>
        <MetricsTable
          metrics={[
            ...('valuationMethod' in pricing && pricing.valuationMethod !== 'cash'
              ? [
                  { label: 'Available financing', value: formatBalance(availableFinancing, pool.currency.displayName) },
                  {
                    label: 'Total financed',
                    value: formatBalance(loan.totalBorrowed?.toDecimal() ?? 0, pool?.currency.symbol, 2),
                  },
                ]
              : []),
            ...(loan.status === 'Active'
              ? [
                  {
                    label: 'Outstanding',
                    value: formatBalance(loan.outstandingDebt?.toDecimal() ?? 0, pool?.currency.symbol, 2),
                  },
                  {
                    label: 'Total repaid',
                    value: formatBalance(loan.totalRepaid?.toDecimal() ?? 0, pool?.currency.symbol, 2),
                  },
                ]
              : []),
            ...(pricing.maturityDate ? [{ label: 'Maturity date', value: formatDate(pricing.maturityDate) }] : []),
            ...('maturityExtensionDays' in pricing && pricing.valuationMethod !== 'cash'
              ? [{ label: 'Extension period', value: `${pricing.maturityExtensionDays ?? 0} days` }]
              : []),
            ...(isOutstandingDebtOrDiscountedCashFlow
              ? [
                  {
                    label: 'Advance rate',
                    value: pricing.advanceRate && formatPercentage(pricing.advanceRate.toPercent()),
                  },
                ]
              : []),
            ...('valuationMethod' in pricing && pricing.valuationMethod !== 'cash'
              ? [
                  {
                    label: 'Interest rate',
                    value: pricing.interestRate && formatPercentage(pricing.interestRate.toPercent()),
                  },
                ]
              : []),
            ...('valuationMethod' in pricing && pricing.valuationMethod === 'discountedCashFlow'
              ? [
                  {
                    label: 'Probability of default',
                    value: pricing.probabilityOfDefault && formatPercentage(pricing.probabilityOfDefault.toPercent()),
                  },
                  {
                    label: 'Loss given default',
                    value:
                      pricing.probabilityOfDefault &&
                      pricing.lossGivenDefault &&
                      formatPercentage(pricing.lossGivenDefault.toPercent()),
                  },
                  {
                    label: 'Expected loss',
                    value:
                      pricing.probabilityOfDefault &&
                      pricing.lossGivenDefault &&
                      pricing.probabilityOfDefault &&
                      formatPercentage(
                        pricing.lossGivenDefault.toFloat() * pricing.probabilityOfDefault.toFloat() * 100
                      ),
                  },
                  {
                    label: 'Discount rate',
                    value:
                      pricing.probabilityOfDefault &&
                      pricing.discountRate &&
                      formatPercentage(pricing.discountRate.toPercent()),
                  },
                ]
              : []),
          ]}
        />
      </Stack>
    </Card>
  )
}
