import { Pool } from '@centrifuge/centrifuge-js'
import { AnchorButton, Box, Card, IconDownload, Shelf, Spinner, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import styled, { useTheme } from 'styled-components'
import { formatDate } from '../../utils/date'
import { formatBalance, formatBalanceAbbreviated } from '../../utils/formatting'
import { getCSVDownloadUrl } from '../../utils/getCSVDownloadUrl'
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

const FilterButton = styled(Stack)`
  &:hover {
    cursor: pointer;
  }
`

const filterOptions = [
  { value: 'price', label: 'Price' },
  { value: 'value', label: 'Asset value' },
] as const

function AssetPerformanceChart({ pool, poolId, loanId }: Props) {
  const theme = useTheme()
  const chartColor = theme.colors.accentPrimary
  const asset = useLoan(poolId, loanId)
  const assetSnapshots = useAssetSnapshots(poolId, loanId)

  const [activeFilter, setActiveFilter] = React.useState<(typeof filterOptions)[number]>(filterOptions[0])

  React.useEffect(() => {
    if (assetSnapshots && assetSnapshots[0]?.currentPrice?.toString() === '0') {
      setActiveFilter(filterOptions[1])
    }
  }, [assetSnapshots])

  const dataUrl: any = React.useMemo(() => {
    if (!assetSnapshots || !assetSnapshots?.length) {
      return undefined
    }

    return getCSVDownloadUrl(assetSnapshots as any)
  }, [assetSnapshots])

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

  if (!assetSnapshots) return <Spinner style={{ margin: 'auto', height: 350 }} />

  return (
    <Card p={3} height={350}>
      <Stack gap={2}>
        <Shelf justifyContent="space-between">
          <Text fontSize="18px" fontWeight="500">
            {asset && 'valuationMethod' in asset.pricing && asset?.pricing.valuationMethod !== 'cash'
              ? 'Asset performance'
              : 'Cash balance'}
          </Text>
          {!isChartEmpty && (
            <AnchorButton
              href={dataUrl}
              download={`asset-${loanId}-timeseries.csv`}
              variant="secondary"
              icon={IconDownload}
              small
            >
              Download
            </AnchorButton>
          )}
        </Shelf>

        {isChartEmpty && <Text variant="label1">No data yet</Text>}

        {!(assetSnapshots && assetSnapshots[0]?.currentPrice?.toString() === '0') && (
          <Stack>
            <Shelf justifyContent="flex-end">
              {data.length > 0 &&
                filterOptions.map((filter, index) => (
                  <React.Fragment key={filter.label}>
                    <FilterButton gap={1} onClick={() => setActiveFilter(filter)}>
                      <Text variant="body3" whiteSpace="nowrap">
                        <Text variant={filter.value === activeFilter.value && 'emphasized'}>{filter.label}</Text>
                      </Text>
                      <Box
                        width="100%"
                        backgroundColor={filter.value === activeFilter.value ? '#000000' : '#E0E0E0'}
                        height="2px"
                      />
                    </FilterButton>
                    {index !== filterOptions.length - 1 && (
                      <Box width="24px" backgroundColor="#E0E0E0" height="2px" alignSelf="flex-end" />
                    )}
                  </React.Fragment>
                ))}
            </Shelf>
          </Stack>
        )}

        <Shelf gap={4} width="100%" color="textSecondary">
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
                  style={{ fontSize: 8, fill: theme.colors.textSecondary, letterSpacing: '-0.7px' }}
                  dy={4}
                  interval={10}
                  angle={-40}
                  textAnchor="end"
                />
                <YAxis
                  stroke="none"
                  tickLine={false}
                  style={{ fontSize: '10px', fill: theme.colors.textSecondary }}
                  tickFormatter={(tick: number) => formatBalanceAbbreviated(tick, '', 2)}
                  domain={activeFilter.value === 'price' ? priceRange : [0, 'auto']}
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
                                <Text variant="label2">{'Value'}</Text>
                                <Text variant="label2">
                                  {payload[0].payload.historicPV
                                    ? formatBalance(payload[0].payload.historicPV, 'USD' || '', 2)
                                    : payload[0].payload.futurePV
                                    ? `~${formatBalance(payload[0].payload.futurePV, 'USD' || '', 2)}`
                                    : '-'}
                                </Text>
                              </Shelf>
                              <Shelf justifyContent="space-between" pl="4px" key={index}>
                                <Text variant="label2">{'Price'}</Text>
                                <Text variant="label2">
                                  {payload[0].payload.historicPrice
                                    ? formatBalance(payload[0].payload.historicPrice, 'USD' || '', 6)
                                    : payload[0].payload.futurePrice
                                    ? `~${formatBalance(payload[0].payload.futurePrice, 'USD' || '', 6)}`
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

                {activeFilter.value === 'price' && (
                  <Line type="monotone" dataKey="historicPrice" stroke="#1253FF" strokeWidth={2} dot={false} />
                )}
                {activeFilter.value === 'price' && (
                  <Line
                    type="monotone"
                    dataKey="futurePrice"
                    stroke="#c2d3ff"
                    strokeWidth={2}
                    dot={false}
                    strokeDasharray="6 6"
                  />
                )}

                {activeFilter.value === 'value' && (
                  <Line type="monotone" dataKey="historicPV" stroke="#1253FF" strokeWidth={2} dot={false} />
                )}
                {activeFilter.value === 'value' && (
                  <Line
                    type="monotone"
                    dataKey="futurePV"
                    stroke="#c2d3ff"
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
