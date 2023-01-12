import { CurrencyBalance, Pool } from '@centrifuge/centrifuge-js'
import { AnchorButton, IconDownload, Text } from '@centrifuge/fabric'
import React from 'react'
import { formatDate } from '../utils/date'
import { formatBalance } from '../utils/formatting'
// import { usePoolLiquidityTransactions } from '../utils/usePools'
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
  // const data = usePoolLiquidityTransactions(pool, fromEpoch, toEpoch)
  const data = mockData(10, pool.currency.decimals)

  console.log(data)

  const dataUrl: any = React.useMemo(() => {
    if (!data || !data?.length) {
      return undefined
    }

    const csvData = []
    const formatted = data.map((entry) => ({
      'Epoche index': entry.index,
      'Opened at': `"${formatDate(entry.openedAt)}"`,
      'Executed at': `"${formatDate(entry.executedAt)}"`,
      'Closed at': `"${formatDate(entry.closedAt)}"`,
      [dataNames[0]]: entry[dataKeys[0]]
        ? `"${formatBalance(entry[dataKeys[0]].toNumber(), pool.currency.symbol)}"`
        : formatBalance(0, pool.currency.symbol),
      [dataNames[1]]: entry[dataKeys[1]]
        ? `"${formatBalance(entry[dataKeys[1]].toNumber(), pool.currency.symbol)}"`
        : formatBalance(0, pool.currency.symbol),
    }))

    const columnHeaders = Object.keys(formatted[0])
    csvData.push(columnHeaders)

    formatted.forEach((entry) => {
      csvData.push(Object.values(entry))
    })

    let csvContent = ''
    csvData.forEach((row) => {
      csvContent += row.join(',') + '\n'
    })

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8,' })
    return URL.createObjectURL(blob)
  }, [data, dataKeys, dataNames, pool.currency.symbol])

  const chartData: StackedBarChartProps['data'] = React.useMemo(() => {
    return (
      data?.map((entry) => ({
        xAxis: entry.index,
        top: entry[dataKeys[0]]?.toNumber() || 0,
        bottom: entry[dataKeys[1]]?.toNumber() || 0,
        date: entry.closedAt,
      })) || []
    )
  }, [data, dataKeys])

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
        !!data &&
        !!data.length &&
        formatDate(data[0].closedAt, { year: undefined }) + ' - ' + formatDate(data[data.length - 1].closedAt)
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
          xAxisLabel="Latest epoch"
          currency={pool.currency.symbol}
        />
      ) : (
        <Text variant="label1">No data yet</Text>
      )}
    </PageSection>
  )
}

//======================

function mockData(size: number, decimals: number) {
  const date = new Date()

  return new Array(size).fill(true).map((_, index) => {
    const newDate = new Date(date.setDate(date.getDate() + index + 1)).toISOString()

    return {
      index: index + 4,
      closedAt: newDate,
      executedAt: newDate,
      id: Math.random().toString(36).substring(2),
      openedAt: newDate,
      sumBorrowedAmount: new CurrencyBalance(getRandomInt(10, 40000), decimals),
      sumRepaidAmount: new CurrencyBalance(getRandomInt(0, 40000), decimals),
      sumInvestedAmount: new CurrencyBalance(getRandomInt(10, 40000), decimals),
      sumRedeemedAmount: new CurrencyBalance(getRandomInt(0, 40000), decimals),
    }
  })
}

function getRandomInt(min: number, max: number) {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min + 1)) + min
}
