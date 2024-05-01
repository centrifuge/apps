import { CurrencyBalance } from '@centrifuge/centrifuge-js'
import { Pool } from '@centrifuge/centrifuge-js/dist/modules/pools'
import { Text } from '@centrifuge/fabric'
import * as React from 'react'
import { formatDate } from '../../utils/date'
import { formatBalance } from '../../utils/formatting'
import { getCSVDownloadUrl } from '../../utils/getCSVDownloadUrl'
import { useDailyPoolStates, useMonthlyPoolStates } from '../../utils/usePools'
import { DataTable } from '../DataTable'
import { DataTableGroup } from '../DataTableGroup'
import { Spinner } from '../Spinner'
import { ReportContext } from './ReportContext'
import { UserFeedback } from './UserFeedback'
import type { TableDataRow } from './index'

export function PoolBalance({ pool }: { pool: Pool }) {
  const { startDate, endDate, groupBy, setCsvData } = React.useContext(ReportContext)

  const { poolStates: dailyPoolStates } = useDailyPoolStates(pool.id, new Date(startDate), new Date(endDate)) || {}
  const monthlyPoolStates = useMonthlyPoolStates(pool.id, new Date(startDate), new Date(endDate))
  const poolStates = groupBy === 'day' ? dailyPoolStates : monthlyPoolStates

  const columns = React.useMemo(() => {
    if (!poolStates) {
      return []
    }

    return [
      {
        align: 'left',
        header: '',
        cell: (row: TableDataRow) => <Text variant={row.heading ? 'heading4' : 'body3'}>{row.name}</Text>,
        width: '200px',
      },
    ]
      .concat(
        poolStates.map((state, index) => ({
          align: 'right',
          timestamp: state.timestamp,
          header:
            groupBy === 'day'
              ? new Date(state.timestamp).toLocaleDateString('en-US', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : new Date(state.timestamp).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
          cell: (row: TableDataRow) => (
            <Text variant="body3">
              {(row.value as any)[index] !== '' && formatBalance((row.value as any)[index], pool.currency.symbol, 5)}
            </Text>
          ),
          width: '170px',
        }))
      )
      .concat({
        align: 'left',
        header: '',
        cell: () => <span />,
        width: '1fr',
      })
  }, [poolStates, groupBy, pool])

  const overviewRecords: TableDataRow[] = React.useMemo(() => {
    return [
      {
        name: 'NAV',
        value: poolStates?.map((state) => state.poolValue.toFloat()) || [],
        heading: false,
      },
      {
        name: 'Asset value',
        value: poolStates?.map((state) => state.poolValue.toFloat() - state.poolState.totalReserve.toFloat()) || [],
        heading: false,
      },
      {
        name: 'Onchain reserve',
        value: poolStates?.map((state) => state.poolState.totalReserve.toFloat()) || [],
        heading: false,
      },
      {
        name: 'Accrued fees',
        value:
          poolStates?.map((state) =>
            state.sumAccruedAmountByPeriod
              ? new CurrencyBalance(state.sumAccruedAmountByPeriod, pool.currency.decimals).toDecimal().toNumber()
              : '-'
          ) || [],
        heading: false,
      },
    ]
  }, [poolStates])

  const priceRecords: TableDataRow[] = React.useMemo(() => {
    return [
      {
        name: 'Token price',
        value: poolStates?.map(() => '' as any) || [],
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
              state.tranches[token.id]?.price ? state.tranches[token.id].price!.toFloat() : 1
            ) || [],
          heading: false,
        })) || []
    )
  }, [poolStates, pool?.tranches])

  const inOutFlowRecords: TableDataRow[] = React.useMemo(() => {
    return [
      {
        name: 'Investments',
        value: poolStates?.map(() => '' as any) || [],
        heading: false,
      },
    ].concat(
      pool?.tranches
        .slice()
        .reverse()
        .map((token) => ({
          name: `\u00A0 \u00A0 ${token.currency.name.split(' ').at(-1)} tranche`,
          value: poolStates?.map((state) => state.tranches[token.id]?.fulfilledInvestOrders.toFloat() ?? 0) || [],
          heading: false,
        })) || [],
      [
        {
          name: 'Redemptions',
          value: poolStates?.map(() => '' as any) || [],
          heading: false,
        },
      ].concat(
        pool?.tranches
          .slice()
          .reverse()
          .map((token) => ({
            name: `\u00A0 \u00A0 ${token.currency.name.split(' ').at(-1)} tranche`,
            value: poolStates?.map((state) => state.tranches[token.id]?.fulfilledRedeemOrders ?? 0) || [],
            heading: false,
          })) || []
      )
    )
  }, [poolStates, pool?.tranches])

  const headers = columns.slice(0, -1).map(({ header }) => header)

  React.useEffect(() => {
    const f = [...overviewRecords, ...priceRecords, ...inOutFlowRecords].map(({ name, value }) => [
      name.trim(),
      ...(value as string[]),
    ])
    let formatted = f.map((values) =>
      Object.fromEntries(headers.map((_, index) => [headers[index], `"${values[index]}"`]))
    )

    console.log('formatted', formatted, f)
    if (!formatted.length) {
      return
    }

    const dataUrl = getCSVDownloadUrl(formatted)

    setCsvData({
      dataUrl,
      fileName: `${pool.id}-pool-balance-${formatDate(startDate, {
        weekday: 'short',
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      }).replaceAll(',', '')}-${formatDate(endDate, {
        weekday: 'short',
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      }).replaceAll(',', '')}.csv`,
    })

    return () => {
      setCsvData(undefined)
      URL.revokeObjectURL(dataUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overviewRecords, priceRecords, inOutFlowRecords])

  if (!poolStates) {
    return <Spinner mt={2} />
  }

  return poolStates?.length > 0 ? (
    <DataTableGroup>
      <DataTable data={overviewRecords} columns={columns} hoverable />
      <DataTable data={priceRecords} columns={columns} hoverable />
      <DataTable data={inOutFlowRecords} columns={columns} hoverable />
    </DataTableGroup>
  ) : (
    <UserFeedback reportType="Pool balance" />
  )
}
