import { Pool } from '@centrifuge/centrifuge-js/dist/modules/pools'
import { Text } from '@centrifuge/fabric'
import * as React from 'react'
import { formatBalance } from '../../utils/formatting'
import { getCSVDownloadUrl } from '../../utils/getCSVDownloadUrl'
import { useDailyPoolStates, useMonthlyPoolStates } from '../../utils/usePools'
import { DataTable } from '../DataTable'
import { DataTableGroup } from '../DataTableGroup'
import type { TableDataRow } from './index'
import { ReportContext } from './ReportContext'

export function PoolBalance({ pool }: { pool: Pool }) {
  const { startDate, endDate, groupBy, setCsvData } = React.useContext(ReportContext)

  const dailyPoolStates = useDailyPoolStates(pool.id, startDate, endDate)
  const monthlyPoolStates = useMonthlyPoolStates(pool.id, startDate, endDate)
  const poolStates = groupBy === 'day' ? dailyPoolStates : monthlyPoolStates

  const columns = React.useMemo(() => {
    if (!poolStates) {
      return []
    }

    return [
      {
        align: 'left',
        header: '',
        cell: (row: TableDataRow) => <Text variant={row.heading ? 'heading4' : 'body2'}>{row.name}</Text>,
        flex: '1 0 200px',
      },
    ].concat(
      poolStates.map((state, index) => ({
        align: 'right',
        header: `${new Date(state.timestamp).toLocaleDateString('en-US', {
          month: 'short',
        })} ${
          groupBy === 'day'
            ? new Date(state.timestamp).toLocaleDateString('en-US', { day: 'numeric' })
            : new Date(state.timestamp).toLocaleDateString('en-US', { year: 'numeric' })
        }`,
        cell: (row: TableDataRow) => <Text variant="body2">{(row.value as any)[index]}</Text>,
        flex: '0 0 100px',
      }))
    )
  }, [poolStates])

  const overviewRecords: TableDataRow[] = React.useMemo(() => {
    return [
      {
        name: 'Pool value',
        value: poolStates?.map((state) => formatBalance(state.poolValue)) || [],
        heading: false,
      },
      {
        name: 'Asset value',
        value: poolStates?.map((state) => formatBalance(state.poolState.portfolioValuation)) || [],
        heading: false,
      },
      {
        name: 'Reserve',
        value: poolStates?.map((state) => formatBalance(state.poolState.totalReserve)) || [],
        heading: false,
      },
    ]
  }, [poolStates])

  const priceRecords: TableDataRow[] = React.useMemo(() => {
    return [
      {
        name: 'Token price',
        value: poolStates?.map(() => '') || [],
        heading: false,
      },
    ].concat(
      pool?.tranches
        .slice()
        .reverse()
        .map((token) => ({
          name: `\u00A0 \u00A0 ${token.currency.name.split(' ').at(-1)} tranche`,
          value:
            poolStates?.map((state) =>
              state.tranches[token.id].price ? formatBalance(state.tranches[token.id].price?.toFloat()!) : '1.000'
            ) || [],
          heading: false,
        })) || []
    )
  }, [poolStates])

  const inOutFlowRecords: TableDataRow[] = React.useMemo(() => {
    return [
      {
        name: 'Investments',
        value: poolStates?.map(() => '') || [],
        heading: false,
      },
    ].concat(
      pool?.tranches
        .slice()
        .reverse()
        .map((token) => ({
          name: `\u00A0 \u00A0 ${token.currency.name.split(' ').at(-1)} tranche`,
          value:
            poolStates?.map((state) => formatBalance(state.tranches[token.id].fulfilledInvestOrders.toDecimal())) || [],
          heading: false,
        })) || [],
      [
        {
          name: 'Redemptions',
          value: poolStates?.map(() => '') || [],
          heading: false,
        },
      ].concat(
        pool?.tranches
          .slice()
          .reverse()
          .map((token) => ({
            name: `\u00A0 \u00A0 ${token.currency.name.split(' ').at(-1)} tranche`,
            value:
              poolStates?.map((state) => formatBalance(state.tranches[token.id].fulfilledRedeemOrders.toDecimal())) ||
              [],
            heading: false,
          })) || []
      )
    )
  }, [poolStates])

  const headers = columns.map(({ header }) => header)

  const dataUrl = React.useMemo(() => {
    const formatted = [...overviewRecords, ...priceRecords, ...inOutFlowRecords]
      .map(({ name, value }) => [name, ...(value as string[])])
      .map((values) => Object.fromEntries(headers.map((_, index) => [headers[index], `"${values[index]}"`])))

    return getCSVDownloadUrl(formatted)
  }, [overviewRecords, priceRecords, inOutFlowRecords])

  React.useEffect(() => {
    setCsvData({
      dataUrl,
      fileName: `Pool-${pool.id}.csv`,
    })

    return () => setCsvData(undefined)
  }, [dataUrl])

  return (
    <DataTableGroup>
      <DataTable data={overviewRecords} columns={columns} hoverable />
      <DataTable data={priceRecords} columns={columns} hoverable />
      <DataTable data={inOutFlowRecords} columns={columns} hoverable />
    </DataTableGroup>
  )
}
