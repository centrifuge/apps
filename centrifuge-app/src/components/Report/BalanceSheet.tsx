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
}

export function BalanceSheet({ pool }: { pool: Pool }) {
  const { startDate, endDate, groupBy, setCsvData, setEndDate } = React.useContext(ReportContext)

  const [adjustedStartDate, adjustedEndDate] = React.useMemo(() => {
    const today = new Date()
    today.setDate(today.getDate())
    today.setHours(0, 0, 0, 0)
    switch (groupBy) {
      case 'day':
        const from = new Date(startDate ?? today)
        from.setHours(0, 0, 0, 0)
        const to = new Date(startDate ?? today)
        to.setDate(to.getDate() + 1)
        to.setHours(0, 0, 0, 0)
        setEndDate(to.toISOString())
        return [from, to]
      case '30-day':
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        thirtyDaysAgo.setHours(0, 0, 0, 0)
        return [thirtyDaysAgo, today]
      case 'month':
      case 'quarter':
        const oneYearAgo = new Date()
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
        oneYearAgo.setHours(0, 0, 0, 0)
        return [oneYearAgo, today]
      case 'year':
        const oneYearsAgo = new Date()
        oneYearsAgo.setFullYear(oneYearsAgo.getFullYear() - 1)
        oneYearsAgo.setHours(0, 0, 0, 0)
        return [oneYearsAgo, today]
      default:
        throw new Error('No filter set')
    }
  }, [groupBy, startDate])

  const poolStates = usePoolStatesByGroup(
    pool.id,
    adjustedStartDate ? adjustedStartDate : undefined,
    adjustedEndDate ? adjustedEndDate : undefined,
    groupBy
  )

  const columns = React.useMemo(() => {
    if (!poolStates) {
      return []
    }

    return [
      {
        align: 'left',
        header: '',
        cell: (row: TableDataRow) => <Text variant={row.heading ? 'body3' : 'body3'}>{row.name}</Text>,
        width: '200px',
      },
    ]
      .concat(
        poolStates.map((state, index) => ({
          align: 'right',
          timestamp: state.timestamp,
          header: new Date(state.timestamp).toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }),
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
        value: poolStates?.map(({ poolState }) => poolState.portfolioValuation.toDecimal()) || [],
        heading: false,
        formatter: (v: any) => (v ? formatBalance(v, pool.currency.displayName, 2) : ''),
      },
      {
        name: '\u00A0 \u00A0 + Onchain reserve',
        value: poolStates?.map(({ poolState }) => poolState.totalReserve.toDecimal()) || [],
        heading: false,
        formatter: (v: any) => (v ? formatBalance(v, pool.currency.displayName, 2) : ''),
      },
      {
        name: '\u00A0 \u00A0 + Offchain cash',
        value: poolStates?.map(({ poolState }) => poolState.offchainCashValue.toDecimal()) || [],
        heading: false,
        formatter: (v: any) => (v ? formatBalance(v, pool.currency.displayName, 2) : ''),
      },
      {
        name: '\u00A0 \u00A0 - Accrued fees',
        value: poolStates?.map(({ poolState }) => poolState.sumPoolFeesPendingAmount.toDecimal()) || [],
        heading: false,
        formatter: (v: any) => (v ? formatBalance(v, pool.currency.displayName, 2) : ''),
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
          return [
            {
              name: `${token.currency.displayName} token supply`,
              value: poolStates?.map((poolState) => poolState.tranches[token.id].tokenSupply || ('' as any)) || [],
              heading: false,
              formatter: (v: any) => (v ? formatBalance(v.toDecimal(), token.currency.displayName, 2) : ''),
            },
            {
              name: `\u00A0 \u00A0 * ${token.currency.displayName} token price`,
              value: poolStates?.map((poolState) => poolState.tranches[token.id].price || ('' as any)) || [],
              heading: false,
              formatter: (v: any) => (v ? formatBalance(v.toDecimal(), pool.currency.displayName, 2) : ''),
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
              formatter: (v: any) => (v ? formatBalance(v, pool.currency.displayName, 2) : ''),
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
          value: poolStates?.map(({ poolState }) => poolState.portfolioValuation.toDecimal()) || [],
          heading: false,
          formatter: (v: any) => (v ? formatBalance(v, pool.currency.displayName, 2) : ''),
        }}
      />
      <DataTable
        data={trancheRecords}
        columns={columns}
        hoverable
        summary={{
          name: '= Total capital',
          value:
            poolStates?.map((poolState) =>
              Object.values(poolState.tranches).reduce((acc, tranche) => {
                const price = tranche.price || new Price(0)
                const supply = tranche.tokenSupply
                return acc.add(price.toDecimal().mul(supply.toDecimal()))
              }, Dec(0))
            ) || [],
          heading: false,
          formatter: (v: any) => (v ? formatBalance(v, pool.currency.displayName, 2) : ''),
        }}
      />
    </DataTableGroup>
  ) : (
    <UserFeedback reportType="Token price" />
  )
}
