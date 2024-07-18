import { Loan, Pool, TinlakeLoan } from '@centrifuge/centrifuge-js'
import { Card, Stack, Text } from '@centrifuge/fabric'
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

    const days = getAge(new Date(latestOraclePrice.timestamp).toISOString())

    const borrowerAssetTransactions = assetTransactions?.filter(
      (assetTransaction) => assetTransaction.asset.id === `${loan.poolId}-${loan.id}`
    )
    const latestPrice = getLatestPrice(latestOraclePrice.value, borrowerAssetTransactions, pool.currency.decimals)

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
                label: `Latest price${latestOraclePrice.value.isZero() && latestPrice ? ' (settlement)' : ''}`,
                value: latestPrice ? `${formatBalance(latestPrice, pool.currency.symbol, 6, 2)}` : '-',
              },
              { label: 'Price last updated', value: days === '0' ? `${days} ago` : `Today` },
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
            ...(pricing.maturityDate ? [{ label: 'Maturity date', value: formatDate(pricing.maturityDate) }] : []),
            ...('maturityExtensionDays' in pricing && pricing.valuationMethod !== 'cash'
              ? [{ label: 'Extension period', value: `${pricing.maturityExtensionDays} days` }]
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
