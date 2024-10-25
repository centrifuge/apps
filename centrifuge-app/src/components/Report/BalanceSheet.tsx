import { Price } from '@centrifuge/centrifuge-js'
import { Pool } from '@centrifuge/centrifuge-js/dist/modules/pools'
import { formatBalance } from '@centrifuge/centrifuge-react'
import { Text } from '@centrifuge/fabric'
import * as React from 'react'
import { Dec } from '../../utils/Decimal'
import { formatDate } from '../../utils/date'
import { getCSVDownloadUrl } from '../../utils/getCSVDownloadUrl'
import { usePoolStatesByGroup } from '../../utils/usePools'
import { DataTable } from '../DataTable'
import { DataTableGroup } from '../DataTableGroup'
import { Spinner } from '../Spinner'
import { ReportContext } from './ReportContext'
import { UserFeedback } from './UserFeedback'
import type { TableDataRow } from './index'

type Row = TableDataRow & {
  formatter?: (v: any) => any
  bold?: boolean
}

export function BalanceSheet({ pool }: { pool: Pool }) {
  const { startDate, endDate, groupBy, setCsvData, setReportData } = React.useContext(ReportContext)

  const [adjustedStartDate, adjustedEndDate] = React.useMemo(() => {
    const today = new Date()
    today.setDate(today.getDate())
    today.setHours(0, 0, 0, 0)
    if (groupBy === 'day') {
      const from = new Date(startDate ?? today)
      from.setHours(0, 0, 0, 0)
      const to = new Date(startDate ?? today)
      to.setDate(to.getDate() + 1)
      to.setHours(0, 0, 0, 0)
      return [from, to]
    } else if (groupBy === 'daily') {
      const from = new Date(startDate ?? today)
      from.setHours(0, 0, 0, 0)
      const to = new Date(endDate ?? today)
      to.setDate(to.getDate() + 1)
      to.setHours(0, 0, 0, 0)
      return [from, to]
    } else if (groupBy === 'quarter' || groupBy === 'year') {
      const from = pool.createdAt ? new Date(pool.createdAt) : today
      return [from, today]
    } else {
      const to = new Date(endDate ?? today)
      to.setDate(to.getDate() + 1)
      to.setHours(0, 0, 0, 0)
      return [new Date(startDate), to]
    }
  }, [groupBy, startDate, endDate, pool.createdAt])

  const poolStates = usePoolStatesByGroup(
    pool.id,
    adjustedStartDate,
    adjustedEndDate,
    groupBy === 'daily' ? 'day' : groupBy
  )

  const columns = React.useMemo(() => {
    if (!poolStates) {
      return []
    }

    return [
      {
        align: 'left',
        header: '',
        cell: (row: Row) => (
          <Text variant={row.heading ? 'heading4' : row.bold ? 'interactive2' : 'body3'}>{row.name}</Text>
        ),
        width: '200px',
        isLabel: true,
      },
    ]
      .concat(
        poolStates.map((state, index) => ({
          align: 'left',
          timestamp: state.timestamp,
          header: new Date(state.timestamp).toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }),
          cell: (row: Row) => (
            <Text variant={row.heading ? 'heading4' : row.bold ? 'interactive2' : 'body3'}>
              {row.formatter ? row.formatter((row.value as any)[index]) : (row.value as any)[index]}
            </Text>
          ),
          width: '170px',
          isLabel: false,
        }))
      )
      .concat({
        align: 'left',
        header: '',
        cell: () => <span />,
        width: '1fr',
        isLabel: false,
      })
  }, [poolStates])

  const assetValuationRecords: Row[] = React.useMemo(() => {
    return [
      {
        name: 'Assets',
        value: poolStates?.map(() => '' as any) || [],
        heading: false,
        bold: true,
      },
      {
        name: '\u00A0 \u00A0 Asset valuation',
        value: poolStates?.map(({ poolState }) => poolState.portfolioValuation.toDecimal()) || [],
        heading: false,
        formatter: (v: any) => (v ? formatBalance(v, pool.currency.displayName, 2) : ''),
      },
      {
        name: '\u00A0 \u00A0 Onchain reserve',
        value: poolStates?.map(({ poolState }) => poolState.totalReserve.toDecimal()) || [],
        heading: false,
        formatter: (v: any) => (v ? formatBalance(v, pool.currency.displayName, 2) : ''),
      },
      {
        name: '\u00A0 \u00A0 Offchain cash',
        value: poolStates?.map(({ poolState }) => poolState.offchainCashValue.toDecimal()) || [],
        heading: false,
        formatter: (v: any) => (v ? formatBalance(v, pool.currency.displayName, 2) : ''),
      },
      {
        name: '\u00A0 \u00A0 Accrued fees',
        value: poolStates?.map(({ poolState }) => poolState.sumPoolFeesPendingAmount.toDecimal().neg()) || [],
        heading: false,
        formatter: (v: any) => (v ? `${formatBalance(v, pool.currency.displayName, 2)}` : ''),
      },
      {
        name: 'Net Asset Value (NAV)',
        value: poolStates?.map(({ poolState }) => poolState.netAssetValue.toDecimal()) || [],
        heading: true,
        formatter: (v: any) => (v ? formatBalance(v, pool.currency.displayName, 2) : ''),
      },
    ]
  }, [pool.currency.displayName, poolStates])

  const trancheRecords: Row[] = React.useMemo(() => {
    return [
      {
        name: 'Capital',
        value: poolStates?.map(() => '' as any) || [],
        heading: false,
        bold: true,
      },
      ...(pool?.tranches
        .slice()
        .reverse()
        .map((token) => {
          return [
            {
              name: `\u00A0 \u00A0 ${token.currency.displayName} token supply`,
              value: poolStates?.map((poolState) => poolState.tranches[token.id].tokenSupply || ('' as any)) || [],
              heading: false,
              formatter: (v: any) => (v ? formatBalance(v.toDecimal(), token.currency.displayName, 2) : ''),
            },
            {
              name: `\u00A0 \u00A0 * ${token.currency.displayName} token price`,
              value: poolStates?.map((poolState) => poolState.tranches[token.id].price || ('' as any)) || [],
              heading: false,
              formatter: (v: any) => (v ? formatBalance(v.toDecimal(), pool.currency.displayName, 6) : ''),
            },
            {
              name: `\u00A0 \u00A0 = ${token.currency.displayName} tranche value`,
              value:
                poolStates?.map(
                  (poolState) =>
                    poolState.tranches[token.id].price
                      ?.toDecimal()
                      .mul(poolState.tranches[token.id].tokenSupply.toDecimal()) || ('' as any)
                ) || [],
              heading: false,
              bold: true,
              formatter: (v: any) => (v ? formatBalance(v, pool.currency.displayName, 2) : ''),
            },
          ]
        })
        .flat() || []),
      {
        name: 'Total capital',
        value:
          poolStates?.map((poolState) =>
            Object.values(poolState.tranches).reduce((acc, tranche) => {
              const price = tranche.price || new Price(0)
              const supply = tranche.tokenSupply
              return acc.add(price.toDecimal().mul(supply.toDecimal()))
            }, Dec(0))
          ) || [],
        heading: true,
        formatter: (v: any) => (v ? formatBalance(v, pool.currency.displayName, 2) : ''),
      },
    ]
  }, [poolStates, pool])

  const headers = columns.slice(0, -1).map(({ header }) => header)

  React.useEffect(() => {
    const f = [...assetValuationRecords, ...trancheRecords].map(({ name, value }) => [
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

    if (!dataUrl) {
      throw new Error('Failed to generate CSV')
    }

    setCsvData({
      dataUrl,
      fileName: `${pool.id}-balance-sheet-${formatDate(startDate, {
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

  React.useEffect(() => {
    if (poolStates?.length) {
      setReportData(poolStates)
    }
  }, [poolStates, setReportData])

  if (!poolStates) {
    return <Spinner mt={2} />
  }

  return poolStates?.length > 0 ? (
    <DataTableGroup>
      <DataTable data={assetValuationRecords} columns={columns} hoverable />
      <DataTable data={trancheRecords} columns={columns} hoverable />
    </DataTableGroup>
  ) : (
    <UserFeedback reportType="Balance sheet" />
  )
}
