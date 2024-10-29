import { CurrencyBalance, Pool } from '@centrifuge/centrifuge-js'
import { AnchorButton, Box, Card, IconDownload, Shelf, Spinner, Stack, Tabs, TabsItem, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useTheme } from 'styled-components'
import { getCSVDownloadUrl } from '../../../src/utils/getCSVDownloadUrl'
import { formatDate } from '../../utils/date'
import { formatBalance, formatBalanceAbbreviated } from '../../utils/formatting'
import { TinlakePool } from '../../utils/tinlake/useTinlakePools'
import { useLoan } from '../../utils/useLoans'
import { useAssetSnapshots } from '../../utils/usePools'
import { TooltipContainer, TooltipTitle } from './Tooltip'

type ChartData = {
  day: Date
  historicPV: number | null
  futurePV: number | null
  historicPrice: number | null
  futurePrice: number | null
}

interface Props {
  pool: Pool | TinlakePool
  poolId: string
  loanId: string
}

function AssetPerformanceChart({ pool, poolId, loanId }: Props) {
  const theme = useTheme()
  const chartColor = theme.colors.accentPrimary
  const asset = useLoan(poolId, loanId)
  const assetSnapshots = useAssetSnapshots(poolId, loanId)

  const [selectedTabIndex, setSelectedTabIndex] = React.useState(0)

  const data: ChartData[] = React.useMemo(() => {
    if (!asset || !assetSnapshots) return []

    const historic = assetSnapshots
      .filter((day) => {
        return (
          asset &&
          (!asset?.pricing.maturityDate ||
            day.timestamp.getTime() <= new Date(asset?.pricing.maturityDate ?? '').getTime()) &&
          !day.presentValue?.isZero()
        )
      })
      .map((day) => {
        const historicPV = day.presentValue?.toDecimal().toNumber() || 0
        const historicPrice = day.currentPrice?.toDecimal().toNumber() || null

        return { day: new Date(day.timestamp), historicPV, futurePV: null, historicPrice, futurePrice: null }
      })

    if (!asset.pricing.maturityDate) return historic

    const today = new Date()
    today.setDate(today.getDate() + 1)
    const maturity = new Date(asset.pricing.maturityDate ?? '')
    if (today.getTime() >= maturity.getTime() || assetSnapshots.length === 0) return historic

    const days = Math.floor((maturity.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)) + 2

    // TODO: future prices should only be calculated if either the valuation method is
    // outstanding debt or DCF, or the oracle asset has withLinearPricing enabled
    const priceToday = assetSnapshots[assetSnapshots.length - 1].currentPrice?.toFloat()
    const priceAtMaturity =
      asset.pricing && 'outstandingQuantity' in asset.pricing
        ? Number(asset.pricing.notional.toDecimal().toString())
        : null

    const valueToday = assetSnapshots[assetSnapshots.length - 1].presentValue?.toFloat()
    const valueAtMaturity =
      asset.pricing && 'outstandingQuantity' in asset.pricing
        ? Number(asset.pricing.outstandingQuantity.toDecimal().mul(asset.pricing.notional.toDecimal()).toString())
        : null

    if (!priceToday || !priceAtMaturity || !valueAtMaturity || !valueToday) return historic

    const deltaPricePerDay = (priceAtMaturity - priceToday) / days
    const deltaValuePerDay = (valueAtMaturity - valueToday) / days

    return [
      ...historic,
      ...Array.from({ length: days }, (_, index) => {
        const newDate = new Date(today)
        newDate.setDate(today.getDate() + index)
        return {
          day: newDate,
          historicPV: null,
          futurePV: valueToday + deltaValuePerDay * (index + 1),
          historicPrice: null,
          futurePrice: priceToday + deltaPricePerDay * (index + 1),
        }
      }),
    ]
  }, [asset, assetSnapshots])

  const priceRange = React.useMemo(() => {
    if (!data) return [0, 100]

    const min =
      data?.reduce((prev, curr) => {
        const prevPrice = prev.historicPrice || prev.futurePrice
        const currPrice = curr.historicPrice || curr.futurePrice
        return prevPrice! < currPrice! ? prev : curr
      }, data[0])?.historicPrice || 0

    const max =
      data?.reduce((prev, curr) => {
        const prevPrice = prev.historicPrice || prev.futurePrice
        const currPrice = curr.historicPrice || curr.futurePrice
        return prevPrice! > currPrice! ? prev : curr
      }, data[0])?.historicPrice || 100
    return [min, max]
  }, [data])

  const isChartEmpty = React.useMemo(
    () => !data.length || !assetSnapshots || assetSnapshots.length < 1,
    [data, assetSnapshots]
  )

  const dataUrl: any = React.useMemo(() => {
    if (!assetSnapshots || !assetSnapshots?.length) {
      return undefined
    }

    const formatted = assetSnapshots.map((assetObject: Record<string, any>) => {
      const keys = Object.keys(assetObject)
      const newObj: Record<string, any> = {}

      keys.forEach((assetKey) => {
        newObj[assetKey] =
          assetObject[assetKey] instanceof CurrencyBalance ? assetObject[assetKey].toFloat() : assetObject[assetKey]
      })

      return newObj
    })

    return getCSVDownloadUrl(formatted as any)
  }, [assetSnapshots])

  if (!assetSnapshots) return <Spinner style={{ margin: 'auto', height: 350 }} />

  return (
    <Card p={3} height={320} variant="secondary">
      <Stack gap={2}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex">
            <Text variant="heading4">
              {asset && 'valuationMethod' in asset.pricing && asset?.pricing.valuationMethod !== 'cash'
                ? 'Asset performance'
                : 'Cash balance'}
            </Text>
            <Text variant="body2" style={{ marginLeft: 4 }}>
              ({pool.currency.symbol ?? 'USD'})
            </Text>
          </Box>
          {!(assetSnapshots && assetSnapshots[0]?.currentPrice?.toString() === '0') && (
            <Stack>
              <Shelf justifyContent="flex-end">
                {data.length > 0 && (
                  <Tabs selectedIndex={selectedTabIndex} onChange={(index) => setSelectedTabIndex(index)}>
                    <TabsItem styleOverrides={{ padding: '8px' }} showBorder variant="secondary">
                      Price
                    </TabsItem>
                    <TabsItem styleOverrides={{ padding: '8px' }} showBorder variant="secondary">
                      Asset value
                    </TabsItem>
                  </Tabs>
                )}
              </Shelf>
            </Stack>
          )}
          <AnchorButton
            download={`pool-${poolId}-timeseries.csv`}
            href={dataUrl}
            variant="inverted"
            icon={IconDownload}
            small
          >
            Download
          </AnchorButton>
        </Box>

        {isChartEmpty && (
          <Text variant="body3" style={{ margin: '80px auto 0px' }}>
            No data available
          </Text>
        )}

        <Shelf gap={4} width="100%">
          {data?.length ? (
            <ResponsiveContainer width="100%" height={200} minHeight={200} maxHeight={200}>
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
                  style={{ fontSize: 8, fill: theme.colors.textPrimary, letterSpacing: '-0.7px' }}
                  dy={4}
                  interval={10}
                  angle={-40}
                  textAnchor="end"
                />
                <YAxis
                  stroke="none"
                  tickLine={false}
                  style={{ fontSize: '10px', fill: theme.colors.textPrimary }}
                  tickFormatter={(tick: number) => formatBalanceAbbreviated(tick, '', 2)}
                  domain={selectedTabIndex === 0 ? priceRange : [0, 'auto']}
                  width={90}
                />
                <CartesianGrid stroke={theme.colors.borderPrimary} vertical={false} />
                <Tooltip
                  content={({ payload }) => {
                    if (payload && payload?.length > 0) {
                      return (
                        <TooltipContainer>
                          <TooltipTitle>{formatDate(payload[0].payload.day)}</TooltipTitle>
                          {payload.map(({ value }, index) => (
                            <>
                              <Shelf justifyContent="space-between" pl="4px" key={index}>
                                <Text variant="body3">{'Value'}</Text>
                                <Text variant="body3">
                                  {payload[0].payload.historicPV
                                    ? formatBalance(payload[0].payload.historicPV, pool.currency.symbol, 2)
                                    : payload[0].payload.futurePV
                                    ? `~${formatBalance(payload[0].payload.futurePV, pool.currency.symbol, 2)}`
                                    : '-'}
                                </Text>
                              </Shelf>
                              <Shelf justifyContent="space-between" pl="4px" key={index}>
                                <Text variant="body3">Price</Text>
                                <Text variant="body3">
                                  {payload[0].payload.historicPrice
                                    ? formatBalance(payload[0].payload.historicPrice, pool.currency.symbol, 6)
                                    : payload[0].payload.futurePrice
                                    ? `~${formatBalance(payload[0].payload.futurePrice, pool.currency.symbol, 6)}`
                                    : '-'}
                                </Text>
                              </Shelf>
                            </>
                          ))}
                        </TooltipContainer>
                      )
                    }
                    return null
                  }}
                />

                {selectedTabIndex === 0 && (
                  <Line
                    type="monotone"
                    dataKey="historicPrice"
                    stroke={theme.colors.textGold}
                    strokeWidth={2}
                    dot={false}
                  />
                )}
                {selectedTabIndex === 0 && (
                  <Line
                    type="monotone"
                    dataKey="futurePrice"
                    stroke={theme.colors.textGold}
                    strokeWidth={2}
                    dot={false}
                    strokeDasharray="6 6"
                  />
                )}

                {selectedTabIndex === 1 && (
                  <Line
                    type="monotone"
                    dataKey="historicPV"
                    stroke={theme.colors.textGold}
                    strokeWidth={2}
                    dot={false}
                  />
                )}
                {selectedTabIndex === 1 && (
                  <Line
                    type="monotone"
                    dataKey="futurePV"
                    stroke={theme.colors.textGold}
                    strokeWidth={2}
                    dot={false}
                    strokeDasharray="6 6"
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          ) : null}
        </Shelf>
      </Stack>
    </Card>
  )
}

export default AssetPerformanceChart
