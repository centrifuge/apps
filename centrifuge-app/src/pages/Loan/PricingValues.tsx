import { Loan, Pool, TinlakeLoan } from '@centrifuge/centrifuge-js'
import { Card, Stack, Text } from '@centrifuge/fabric'
import { Tooltips } from '../../components/Tooltips'
import { formatDate, getAge } from '../../utils/date'
import { formatBalance, formatPercentage } from '../../utils/formatting'
import { getLatestPrice } from '../../utils/getLatestPrice'
import { TinlakePool } from '../../utils/tinlake/useTinlakePools'
import { useAvailableFinancing } from '../../utils/useLoans'
import { useAssetTransactions } from '../../utils/usePools'
import { MetricsTable } from './MetricsTable'

type Props = {
  loan: Loan | TinlakeLoan
  pool: Pool | TinlakePool
}

export function PricingValues({ loan, pool }: Props) {
  const { pricing } = loan

  const assetTransactions = useAssetTransactions(loan.poolId)
  const { current: availableFinancing } = useAvailableFinancing(loan.poolId, loan.id)

  const isOutstandingDebtOrDiscountedCashFlow =
    'valuationMethod' in pricing &&
    (pricing.valuationMethod === 'outstandingDebt' || pricing.valuationMethod === 'discountedCashFlow')

  if ('valuationMethod' in pricing && pricing.valuationMethod === 'oracle') {
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)
    let latestOraclePrice = pricing.oracle[0]
    pricing.oracle.forEach((price) => {
      if (price.timestamp > latestOraclePrice.timestamp) {
        latestOraclePrice = price
      }
    })

    const borrowerAssetTransactions = assetTransactions?.filter(
      (assetTransaction) => assetTransaction.asset.id === `${loan.poolId}-${loan.id}`
    )
    const latestPrice = getLatestPrice(latestOraclePrice, borrowerAssetTransactions, pool.currency.decimals)

    const days = latestPrice.timestamp > 0 ? getAge(new Date(latestPrice.timestamp).toISOString()) : undefined

    const accruedPrice = 'currentPrice' in loan && loan.currentPrice

    return (
      <Card p={3}>
        <Stack gap={2}>
          <Text fontSize="18px" fontWeight="500">
            Pricing
          </Text>
          <MetricsTable
            metrics={[
              ...('isin' in pricing.priceId ? [{ label: 'ISIN', value: pricing.priceId.isin }] : []),
              {
                label: `Current price${latestOraclePrice.value.isZero() && latestPrice ? ' (settlement)' : ''}`,
                value: accruedPrice
                  ? `${formatBalance(accruedPrice || latestPrice, pool.currency.symbol, 6, 2)}`
                  : latestPrice
                  ? `${formatBalance(latestPrice.value, pool.currency.symbol, 6, 2)}`
                  : '-',
              },
              {
                label: <Tooltips type="linearAccrual" />,
                value: pricing.withLinearPricing ? 'Enabled' : 'Disabled',
              },
              ...(!pricing.withLinearPricing
                ? [{ label: 'Price last updated', value: days ? `${days} ago` : `Today` }]
                : [{ label: 'Last manual price update', value: days ? `${days} ago` : `Today` }]),
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
        <Text fontSize="18px" fontWeight="500">
          Pricing
        </Text>
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
