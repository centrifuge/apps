import { CurrencyBalance, Pool } from '@centrifuge/centrifuge-js'
import { AnchorButton, IconDownload } from '@centrifuge/fabric'
import * as React from 'react'
import { formatDate } from '../utils/date'
import { formatBalance } from '../utils/formatting'
import { getCSVDownloadUrl } from '../utils/getCSVDownloadUrl'
import { useDailyPoolStates } from '../utils/usePools'
import { Legend, LegendProps } from './Charts/Legend'
import { StackedBarChart, StackedBarChartProps } from './Charts/StackedBarChart'
import { PageSection } from './PageSection'
import { TooltipsProps } from './Tooltips'

type DataKeyType =
  | 'sumBorrowedAmountByPeriod'
  | 'sumRepaidAmountByPeriod'
  | 'sumInvestedAmountByPeriod'
  | 'sumRedeemedAmountByPeriod'

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
  const to = new Date(pool.epoch.lastClosed)
  const from = pool.createdAt ? new Date(pool.createdAt) : new Date(to.getDate() - 10)
  const dailyPoolStates = useDailyPoolStates(pool.id, from, to)

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
  }, [dailyPoolStates, dataKeys, dataNames, pool.currency.symbol])

  const chartData: StackedBarChartProps['data'] = React.useMemo(() => {
    return (
      dailyPoolStates?.map((entry) => {
        // subquery data is saved at end of the day
        // data timestamp is off for 24h
        const date = new Date(entry.timestamp)
        date.setDate(date.getDate() - 1)

        return {
          xAxis: date.getTime(),
          top: entry[dataKeys[0]]
            ? new CurrencyBalance(entry[dataKeys[0]]!, pool.currency.decimals).toDecimal().toNumber()
            : 0,
          bottom: entry[dataKeys[1]]
            ? new CurrencyBalance(entry[dataKeys[1]]!, pool.currency.decimals).toDecimal().toNumber()
            : 0,
          date: date.toISOString(),
        }
      }) || []
    )
  }, [dailyPoolStates, dataKeys])

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
            Data
          </AnchorButton>
        )
      }
    >
      {!!legend && !!legend.length && <Legend data={legend} />}
      {!!chartData && !!chartData.length && (
        <StackedBarChart
          data={chartData}
          names={dataNames}
          colors={dataColors}
          xAxisLabel="Latest day"
          currency={pool.currency.symbol}
        />
      )}
    </PageSection>
  )
}
