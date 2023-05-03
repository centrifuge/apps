import { Pool } from '@centrifuge/centrifuge-js'
import { AnchorButton, IconDownload, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { formatDate } from '../utils/date'
import { formatBalance } from '../utils/formatting'
import { getCSVDownloadUrl } from '../utils/getCSVDownloadUrl'
import { usePoolLiquidityTransactions, usePoolLiquidityTransactionsByDay } from '../utils/usePools'
import { Legend, LegendProps } from './Charts/Legend'
import { StackedBarChart, StackedBarChartProps } from './Charts/StackedBarChart'
import { PageSection } from './PageSection'
import { TooltipsProps } from './Tooltips'

type DataKeyType = 'sumBorrowedAmount' | 'sumRepaidAmount' | 'sumInvestedAmount' | 'sumRedeemedAmount'

type LiquidityTransactionsSectionProps = {
  pool: Pool
  title: string
  dataKeys: [DataKeyType, DataKeyType]
  dataNames: [string, string]
  dataColors: [string, string]
  tooltips: [TooltipsProps['type'], TooltipsProps['type']]
}

export function LiquidityTransactionsSection({
  pool,
  title,
  dataKeys,
  dataNames,
  dataColors,
  tooltips,
}: LiquidityTransactionsSectionProps) {
  const maxEpochs = 10
  const toEpoch = pool.epoch.lastExecuted
  const fromEpoch = toEpoch >= maxEpochs ? toEpoch - maxEpochs : 0
  const data = usePoolLiquidityTransactions(pool, fromEpoch, toEpoch)

  const to = new Date(pool.epoch.lastClosed)
  const from = pool.createdAt ? new Date(pool.createdAt) : new Date(to.getDate() - 10)
  const dataByDay = usePoolLiquidityTransactionsByDay(pool, from, to)

  const dataUrl: any = React.useMemo(() => {
    if (!dataByDay || !dataByDay?.length) {
      return undefined
    }

    const formatted = dataByDay.map((entry) => ({
      // Epoche: entry.index,
      // 'Opened at': `"${formatDate(entry.openedAt)}"`,
      // 'Executed at': `"${formatDate(entry.executedAt)}"`,
      // 'Closed at': `"${formatDate(entry.closedAt)}"`,
      Block: entry.blockNumber,
      Date: `"${formatDate(entry.timestamp)}"`,
      [dataNames[0]]: `"${formatBalance(
        entry[dataKeys[0]] ? entry[dataKeys[0]]!.toDecimal().toNumber() : 0,
        pool.currency.symbol
      )}"`,
      [dataNames[1]]: `"${formatBalance(
        entry[dataKeys[1]] ? entry[dataKeys[1]]!.toDecimal().toNumber() : 0,
        pool.currency.symbol
      )}"`,
    }))

    return getCSVDownloadUrl(formatted)
  }, [data, dataKeys, dataNames, pool.currency.symbol])

  // const chartData: StackedBarChartProps['data'] = React.useMemo(() => {
  //   return (
  //     data?.map((entry) => ({
  //       xAxis: new Date(entry.closedAt).getTime(),
  //       top: entry[dataKeys[0]]?.toDecimal().toNumber() || 0,
  //       bottom: entry[dataKeys[1]]?.toDecimal().toNumber() || 0,
  //       date: entry.closedAt,
  //     })) || []
  //   )
  // }, [data, dataKeys])

  const chartData: StackedBarChartProps['data'] = React.useMemo(() => {
    return (
      dataByDay?.map((entry) => ({
        xAxis: new Date(entry.timestamp).getTime(),
        top: entry[dataKeys[0]]?.toDecimal().toNumber() || 0,
        bottom: entry[dataKeys[1]]?.toDecimal().toNumber() || 0,
        date: entry.timestamp,
      })) || []
    )
  }, [dataByDay, dataKeys])

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

  return (
    <PageSection
      title={title}
      titleAddition={
        !!dataByDay &&
        !!dataByDay.length &&
        `${formatDate(dataByDay[0].timestamp)} - ${formatDate(dataByDay[dataByDay.length - 1].timestamp)}`
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
            Data
          </AnchorButton>
        )
      }
    >
      {!!legend && !!legend.length && <Legend data={legend} />}
      {!!chartData && !!chartData.length ? (
        <StackedBarChart
          data={chartData}
          names={dataNames}
          colors={dataColors}
          xAxisLabel="Latest day"
          currency={pool.currency.symbol}
        />
      ) : (
        <Text variant="label1">No data yet</Text>
      )}
    </PageSection>
  )
}
