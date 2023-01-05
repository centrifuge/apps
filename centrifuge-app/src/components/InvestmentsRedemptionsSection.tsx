import { CurrencyBalance, Pool } from '@centrifuge/centrifuge-js'
import { Text } from '@centrifuge/fabric'
import React from 'react'
import { useTheme } from 'styled-components'
import { formatDate } from '../utils/date'
// import { usePoolLiquidityTransactions } from '../utils/usePools'
import { StackedBarChart } from './Charts/StackedBarChart'
import { PageSection } from './PageSection'

type InvestmentsRedemptionsSectionProps = {
  pool: Pool
}

export function InvestmentsRedemptionsSection({ pool }: InvestmentsRedemptionsSectionProps) {
  const maxEpochs = 10
  const toEpoch = pool.epoch.lastExecuted
  const fromEpoch = toEpoch >= maxEpochs ? toEpoch - maxEpochs : 0
  // const data = usePoolLiquidityTransactions(pool, fromEpoch, toEpoch)
  const data = mockData(10, pool.currency.decimals)

  return (
    <PageSection
      title="Investments & redemptions"
      titleAddition={
        !!data &&
        !!data.length &&
        formatDate(data[0].closedAt, { year: undefined }) + ' - ' + formatDate(data[data.length - 1].closedAt)
      }
    >
      {!!data && !!data.length ? (
        <Chart data={data} currency={pool.currency.symbol} />
      ) : (
        <Text variant="label1">No data yet</Text>
      )}
    </PageSection>
  )
}

function Chart({ data, currency }) {
  const { colors } = useTheme()

  const formatted = data.map((entry) => ({
    xAxis: entry.index,
    top: entry.sumInvestedAmount?.toNumber() || 0,
    bottom: entry.sumRedeemedAmount?.toNumber() || 0,
    date: entry.closedAt,
  }))

  return (
    <StackedBarChart
      data={formatted}
      names={['Investment', 'Redemption']}
      colors={[colors.statusOk, colors.statusCritical]}
      xAxisLabel="Latest epoch"
      currency={currency}
    />
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
      sumBorrowedAmount: undefined,
      sumRepaidAmount: undefined,
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
