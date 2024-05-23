import { Pool } from '@centrifuge/centrifuge-js/dist/modules/pools'
import { Text } from '@centrifuge/fabric'
import * as React from 'react'
import { formatDate } from '../../utils/date'
import { getCSVDownloadUrl } from '../../utils/getCSVDownloadUrl'
import { useDailyPoolStates, useMonthlyPoolStates } from '../../utils/usePools'
import { DataTable } from '../DataTable'
import { DataTableGroup } from '../DataTableGroup'
import { Spinner } from '../Spinner'
import { ReportContext } from './ReportContext'
import { UserFeedback } from './UserFeedback'
import type { TableDataRow } from './index'

type Row = TableDataRow & {
  formatter?: (v: any) => any
}

export function BalanceSheet({ pool }: { pool: Pool }) {
  const { startDate, endDate, groupBy, setCsvData } = React.useContext(ReportContext)

  const { poolStates: dailyPoolStates } =
    useDailyPoolStates(pool.id, startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined) ||
    {}
  const monthlyPoolStates = useMonthlyPoolStates(
    pool.id,
    startDate ? new Date(startDate) : undefined,
    endDate ? new Date(endDate) : undefined
  )
  const poolStates = groupBy === 'day' ? dailyPoolStates : monthlyPoolStates

  const columns = React.useMemo(() => {
    if (!poolStates) {
      return []
    }

    return [
      {
        align: 'left',
        header: '',
        cell: (row: TableDataRow) => <Text variant={row.heading ? 'heading5' : 'body3'}>{row.name}</Text>,
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
          cell: (row: Row) => (
            <Text variant="body3">
              {row.formatter ? row.formatter((row.value as any)[index]) : (row.value as any)[index]}
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

  const assetValuationRecords: Row[] = React.useMemo(() => {
    return [
      {
        name: 'Asset valuation',
        value: poolStates?.map(() => '' as any) || [],
        heading: false,
      },
      {
        name: '+ On-chain reserve',
        value: poolStates?.map(() => '' as any) || [],
        heading: false,
      },
      {
        name: '+ Settlement accounts(s)',
        value: poolStates?.map(() => '' as any) || [],
        heading: false,
      },
      {
        name: '+ Bank accounts(s)',
        value: poolStates?.map(() => '' as any) || [],
        heading: false,
      },
      {
        name: '- Accrued fees',
        value: poolStates?.map(() => '' as any) || [],
        heading: false,
      },
    ]
  }, [poolStates])

  const trancheRecords: Row[] = React.useMemo(() => {
    return [
      {
        name: '',
        value: poolStates?.map(() => '' as any) || [],
        heading: false,
      },
      ...(pool?.tranches
        .slice()
        .reverse()
        .map((token) => {
          const name = token.currency.name.split(' ').at(-1)
          return [
            {
              name: `${name} token supply`,
              value: [''],
              heading: false,
            },
            {
              name: `* ${name} token price`,
              value: [''],
              heading: false,
            },
            {
              name: `= ${name} tranche value`,
              value: [''],
              heading: false,
            },
          ]
        })
        .flat() || []),
    ]
  }, [poolStates, pool])

  const headers = columns.slice(0, -1).map(({ header }) => header)

  React.useEffect(() => {
    const f = [...trancheRecords, ...assetValuationRecords].map(({ name, value }) => [
      name.trim(),
      ...(value as string[]),
    ])
    let formatted = f.map((values) =>
      Object.fromEntries(headers.map((_, index) => [`"${headers[index]}"`, `"${values[index]}"`]))
    )

    if (!formatted.length) {
      return
    }

    const dataUrl = getCSVDownloadUrl(formatted)

    setCsvData({
      dataUrl,
      fileName: `${pool.id}-token-price-${formatDate(startDate, {
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
  }, [assetValuationRecords, trancheRecords])

  if (!poolStates) {
    return <Spinner mt={2} />
  }

  return poolStates?.length > 0 ? (
    <DataTableGroup>
      <DataTable
        data={assetValuationRecords}
        columns={columns}
        hoverable
        summary={{
          name: '= Total assets/NAV',
          value: poolStates?.map(() => '' as any) || [],
          heading: true,
        }}
      />
      <DataTable
        data={trancheRecords}
        columns={columns}
        hoverable
        summary={{
          name: '= Total capital',
          value: poolStates?.map(() => '' as any) || [],
          heading: true,
        }}
      />
    </DataTableGroup>
  ) : (
    <UserFeedback reportType="Token price" />
  )
}
