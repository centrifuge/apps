import { CurrencyBalance, Pool } from '@centrifuge/centrifuge-js'
import { AnchorButton, Box, IconDownload, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import styled from 'styled-components'
import { daysBetween, formatDate } from '../utils/date'
import { formatBalance } from '../utils/formatting'
import { getCSVDownloadUrl } from '../utils/getCSVDownloadUrl'
import { useDailyPoolStates } from '../utils/usePools'
import { Legend, LegendProps } from './Charts/Legend'
import { StackedBarChart, StackedBarChartProps } from './Charts/StackedBarChart'
import { getRangeNumber } from './Charts/utils'
import { PageSection } from './PageSection'
import { TooltipsProps } from './Tooltips'
import { LoadBoundary } from './LoadBoundary'

const rangeFilters = [
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
  { value: 'ytd', label: 'Year to date' },
  { value: 'all', label: 'All' },
] as const

type DataKeyType =
  | 'sumBorrowedAmountByPeriod'
  | 'sumRepaidAmountByPeriod'
  | 'sumInvestedAmountByPeriod'
  | 'sumRedeemedAmountByPeriod'

const RangeFilterButton = styled(Stack)`
  &:hover {
    cursor: pointer;
  }
`

type LiquidityTransactionsSectionProps = {
  pool: Pool
  title: string
  dataKeys: [DataKeyType, DataKeyType]
  dataNames: [string, string]
  dataColors: [string, string]
  tooltips: [TooltipsProps['type'], TooltipsProps['type']]
}

export default function LiquidityTransactionsSection({
  pool,
  title,
  dataKeys,
  dataNames,
  dataColors,
  tooltips,
}: LiquidityTransactionsSectionProps) {
  const { poolStates: dailyPoolStates } = useDailyPoolStates(pool.id) || {}
  const [range, setRange] = React.useState<(typeof rangeFilters)[number]>({ value: 'all', label: 'All' })
  const poolAge = pool.createdAt ? daysBetween(pool.createdAt, new Date()) : 0
  const rangeNumber = getRangeNumber(range.value, poolAge) ?? 100

  const dataUrl: any = React.useMemo(() => {
    if (!dailyPoolStates || !dailyPoolStates?.length) {
      return undefined
    }

    const formatted = dailyPoolStates.map((entry) => ({
      Block: entry.blockNumber,
      Date: `"${formatDate(entry.timestamp)}"`,
      [dataNames[0]]: `"${formatBalance(
        entry[dataKeys[0]]
          ? new CurrencyBalance(entry[dataKeys[0]]!, pool.currency.decimals).toDecimal().toNumber()
          : 0,
        pool.currency.symbol
      )}"`,
      [dataNames[1]]: `"${formatBalance(
        entry[dataKeys[1]]
          ? new CurrencyBalance(entry[dataKeys[1]]!, pool.currency.decimals).toDecimal().toNumber()
          : 0,
        pool.currency.symbol
      )}"`,
    }))

    return getCSVDownloadUrl(formatted)
  }, [dailyPoolStates, dataKeys, dataNames, pool.currency.decimals, pool.currency.symbol])

  const chartData = React.useMemo(() => {
    return (dailyPoolStates
      ?.map((entry) => {
        // subquery data is saved at end of the day
        // data timestamp is off for 24h
        const date = new Date(entry.timestamp)
        date.setDate(date.getDate() - 1)
        const top = entry[dataKeys[0]]
          ? new CurrencyBalance(entry[dataKeys[0]]!, pool.currency.decimals).toDecimal().toNumber()
          : 0

        const bottom = entry[dataKeys[1]]
          ? new CurrencyBalance(entry[dataKeys[1]]!, pool.currency.decimals).toDecimal().toNumber()
          : 0

        if (!top && !bottom) {
          return undefined
        }
        return {
          xAxis: date.getTime(),
          top,
          bottom,
          date: date.toISOString(),
        }
      })
      .slice(-rangeNumber)
      .filter(Boolean) || []) as StackedBarChartProps['data']
  }, [dailyPoolStates, dataKeys, pool.currency.decimals, rangeNumber])

  const legend: LegendProps['data'] = React.useMemo(() => {
    const topTotal = chartData.map(({ top }) => top).reduce((a, b) => a + b, 0)
    const bottomTotal = chartData.map(({ bottom }) => bottom).reduce((a, b) => a + b, 0)

    return chartData && chartData.length
      ? [
          {
            color: dataColors[0],
            tooltip: { type: tooltips[0] },
            body: formatBalance(topTotal, pool.currency.symbol),
          },
          {
            color: dataColors[1],
            tooltip: { type: tooltips[1] },
            body: formatBalance(bottomTotal, pool.currency.symbol),
          },
        ]
      : []
  }, [chartData, dataColors, tooltips, pool.currency.symbol])

  if(!chartData?.length) return null

  return(
  <LoadBoundary>
    <PageSection
      title={title}
      titleAddition={
        !!dailyPoolStates &&
        !!dailyPoolStates.length &&
        `${formatDate(dailyPoolStates[0].timestamp)} - ${formatDate(
          dailyPoolStates[dailyPoolStates.length - 1].timestamp
        )}`
      }
      headerRight={
        !!dataUrl && (
          <AnchorButton
            href={dataUrl}
            download={`Pool-${pool.id}-${dataNames.join('-')}.csv`}
            variant="secondary"
            icon={IconDownload}
            small
          >
            Download
          </AnchorButton>
        )
      }
    >
      <Shelf bg="backgroundPage" width="100%" gap="2">
        {!!legend && !!legend.length && <Legend data={legend} />}
        <Shelf justifyContent="flex-end">
          {chartData.length > 0 &&
            rangeFilters.map((rangeFilter, index) => (
              <React.Fragment key={rangeFilter.label}>
                <RangeFilterButton gap={1} onClick={() => setRange(rangeFilter)}>
                  <Text variant="body3" whiteSpace="nowrap">
                    <Text variant={rangeFilter.value === range.value && 'emphasized'}>{rangeFilter.label}</Text>
                  </Text>
                  <Box
                    width="100%"
                    backgroundColor={rangeFilter.value === range.value ? '#000000' : '#E0E0E0'}
                    height="2px"
                  />
                </RangeFilterButton>
                {index !== rangeFilters.length - 1 && (
                  <Box width="24px" backgroundColor="#E0E0E0" height="2px" alignSelf="flex-end" />
                )}
              </React.Fragment>
            ))}
        </Shelf>
      </Shelf>

      {!!chartData && !!chartData.length && (
        <StackedBarChart data={chartData} names={dataNames} colors={dataColors} currency={pool.currency.symbol} />
      )}
    </PageSection>
    </LoadBoundary>)
}
