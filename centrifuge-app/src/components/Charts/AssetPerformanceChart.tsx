import { Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useTheme } from 'styled-components'
import { formatDate } from '../../utils/date'
import { formatBalance, formatBalanceAbbreviated } from '../../utils/formatting'
import { useLoan } from '../../utils/useLoans'
import { useAssetSnapshots } from '../../utils/usePools'
import { TooltipContainer, TooltipTitle } from './Tooltip'

type ChartData = {
  day: Date
  historic: number | null
  future: number | null
}

interface Props {
  poolId: string
  loanId: string
}

function AssetPerformanceChart({ poolId, loanId }: Props) {
  const theme = useTheme()
  const chartColor = theme.colors.accentPrimary
  const asset = useLoan(poolId, loanId)
  const assetSnapshots = useAssetSnapshots(poolId, loanId)

  const data: ChartData[] = React.useMemo(() => {
    if (!asset || !assetSnapshots) return []

    const historic = assetSnapshots
      .filter((day) => {
        return asset && day.timestamp.getTime() <= new Date(asset?.pricing.maturityDate).getTime()
      })
      .map((day) => {
        const presentValue = day.presentValue?.toDecimal().toNumber() || 0

        return { day: new Date(day.timestamp), historic: presentValue, future: null }
      })

    const today = new Date()
    today.setDate(today.getDate() + 1)
    const maturity = new Date(asset.pricing.maturityDate)
    if (today.getTime() >= maturity.getTime()) return historic

    const days = Math.floor((maturity.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)) + 2

    // TODO: future prices should only be calculated if either the valuation method is
    // outstanding debt or DCF, or the oracle asset has withLinearPricing enabled
    const priceToday = assetSnapshots[assetSnapshots.length - 1].presentValue?.toFloat()
    const priceAtMaturity =
      asset.pricing && 'outstandingQuantity' in asset.pricing
        ? Number(asset.pricing.outstandingQuantity.toDecimal().mul(asset.pricing.notional.toDecimal()).toString())
        : null

    if (!priceAtMaturity || !priceToday) return historic
    const deltaPerDay = (priceAtMaturity - priceToday) / days

    return [
      ...historic,
      ...Array.from({ length: days }, (_, index) => {
        const newDate = new Date(today)
        newDate.setDate(today.getDate() + index)
        return { day: newDate, historic: null, future: priceToday + deltaPerDay * (index + 1) }
      }),
    ]
  }, [asset, assetSnapshots])

  if (assetSnapshots && assetSnapshots?.length < 1) return <Text variant="body2">No data available</Text>

  return (
    <Stack gap={2}>
      <Shelf gap={4} width="100%" color="textSecondary">
        {data?.length ? (
          <ResponsiveContainer width="100%" height="100%" minHeight="200px">
            <LineChart data={data} margin={{ left: -36 }}>
              <defs>
                <linearGradient id="colorPoolValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColor} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={chartColor} stopOpacity={0.2} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="day"
                tickLine={false}
                type="category"
                tickFormatter={(tick: number) => {
                  return new Date(tick).toLocaleString('en-US', { day: 'numeric', month: 'short' })
                }}
                style={{ fontSize: '10px', fill: theme.colors.textSecondary, letterSpacing: '-0.5px' }}
                dy={4}
                interval={10}
              />
              <YAxis
                stroke="none"
                tickLine={false}
                style={{ fontSize: '10px', fill: theme.colors.textSecondary }}
                tickFormatter={(tick: number) => formatBalanceAbbreviated(tick, '', 0)}
              />
              <CartesianGrid stroke={theme.colors.borderPrimary} vertical={false} />
              <Tooltip
                content={({ payload }) => {
                  if (payload && payload?.length > 0) {
                    return (
                      <TooltipContainer>
                        <TooltipTitle>{formatDate(payload[0].payload.day)}</TooltipTitle>
                        {payload.map(({ value }, index) => (
                          <Shelf justifyContent="space-between" pl="4px" key={index}>
                            <Text variant="label2">{payload[0].payload.historic ? 'Value' : 'Expected value'}</Text>
                            <Text variant="label2">
                              {typeof value === 'number' ? formatBalance(value, 'USD' || '') : '-'}
                            </Text>
                          </Shelf>
                        ))}
                      </TooltipContainer>
                    )
                  }
                  return null
                }}
              />
              <Line type="monotone" dataKey="historic" stroke="#1253FF" strokeWidth={2} dot={false} />
              <Line
                type="monotone"
                dataKey="future"
                stroke="#c2d3ff"
                strokeWidth={2}
                dot={false}
                strokeDasharray="6 6"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <Text variant="label1">No data yet</Text>
        )}
      </Shelf>
    </Stack>
  )
}

export default AssetPerformanceChart
