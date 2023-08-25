import { Pool } from '@centrifuge/centrifuge-js/dist/modules/pools'
import { Text } from '@centrifuge/fabric'
import * as React from 'react'
import { formatBalanceAbbreviated } from '../../utils/formatting'
import { getCSVDownloadUrl } from '../../utils/getCSVDownloadUrl'
import { useDailyPoolStates, useMonthlyPoolStates } from '../../utils/usePools'
import { DataTable } from '../DataTable'
import { DataTableGroup } from '../DataTableGroup'
import { Spinner } from '../Spinner'
import type { TableDataRow } from './index'
import { ReportContext } from './ReportContext'
import { UserFeedback } from './UserFeedback'

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
        flex: '0 0 200px',
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
        flex: '0 0 120px',
      }))
    )
  }, [poolStates, groupBy])

  const overviewRecords: TableDataRow[] = React.useMemo(() => {
    return [
      {
        name: 'Pool value',
        value: poolStates?.map((state) => formatBalanceAbbreviated(state.poolValue, pool.currency.symbol)) || [],
        heading: false,
      },
      {
        name: 'Asset value',
        value:
          poolStates?.map((state) =>
            formatBalanceAbbreviated(state.poolState.portfolioValuation, pool.currency.symbol)
          ) || [],
        heading: false,
      },
      {
        name: 'Reserve',
        value:
          poolStates?.map((state) => formatBalanceAbbreviated(state.poolState.totalReserve, pool.currency.symbol)) ||
          [],
        heading: false,
      },
    ]
  }, [poolStates, pool.currency.symbol])

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
              state.tranches[token.id].price
                ? formatBalanceAbbreviated(state.tranches[token.id].price?.toFloat()!, pool.currency.symbol)
                : '1.000'
            ) || [],
          heading: false,
        })) || []
    )
  }, [poolStates, pool.currency.symbol, pool?.tranches])

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
            poolStates?.map((state) =>
              formatBalanceAbbreviated(state.tranches[token.id].fulfilledInvestOrders.toDecimal(), pool.currency.symbol)
            ) || [],
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
              poolStates?.map((state) =>
                formatBalanceAbbreviated(
                  state.tranches[token.id].fulfilledRedeemOrders.toDecimal(),
                  pool.currency.symbol
                )
              ) || [],
            heading: false,
          })) || []
      )
    )
  }, [poolStates, pool.currency.symbol, pool?.tranches])

  const headers = columns.map(({ header }) => header)

  const dataUrl = React.useMemo(() => {
    const formatted = [...overviewRecords, ...priceRecords, ...inOutFlowRecords]
      .map(({ name, value }) => [name, ...(value as string[])])
      .map((values) => Object.fromEntries(headers.map((_, index) => [headers[index], `"${values[index]}"`])))

    return getCSVDownloadUrl(formatted)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overviewRecords, priceRecords, inOutFlowRecords])

  React.useEffect(() => {
    setCsvData({
      dataUrl,
      fileName: `${pool.id}-pool-balance-${startDate}-${endDate}.csv`,
    })

    return () => setCsvData(undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataUrl, pool.id, startDate, endDate])

  if (!poolStates) {
    return <Spinner mt={2} />
  }

  return poolStates?.length > 0 ? (
    <DataTableGroup rounded={false}>
      <DataTable data={overviewRecords} columns={columns} hoverable rounded={false} />
      <DataTable data={priceRecords} columns={columns} hoverable rounded={false} />
      <DataTable data={inOutFlowRecords} columns={columns} hoverable rounded={false} />
    </DataTableGroup>
  ) : (
    <UserFeedback reportType="Pool balance" />
  )
}
