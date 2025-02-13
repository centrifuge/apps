import { Pool } from '@centrifuge/centrifuge-js/dist/modules/pools'
import { Text } from '@centrifuge/fabric'
import * as React from 'react'
import { formatBalance } from '../../../src/utils/formatting-sdk'
import { formatDate } from '../../utils/date'
import { getCSVDownloadUrl } from '../../utils/getCSVDownloadUrl'
import { DataTable } from '../DataTable'
import { DataTableGroup } from '../DataTableGroup'
import { Spinner } from '../Spinner'
import { ReportContext } from './ReportContext'
import { UserFeedback } from './UserFeedback'
import type { TableDataRow } from './index'
import { useReport } from './useReportsQuery'

type Row = TableDataRow & {
  formatter?: (v: any) => any
  bold?: boolean
}

export function BalanceSheet({ pool }: { pool: Pool }) {
  const { startDate, endDate, groupBy, setCsvData, setReportData } = React.useContext(ReportContext)
  const currency = pool.currency.displayName

  const { data: poolStates = [], isLoading } = useReport(
    'balanceSheet',
    pool,
    new Date(startDate),
    new Date(endDate),
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
        value: poolStates?.map((poolState) => poolState.assetValuation.toDecimal()) || [],
        heading: false,
        formatter: (v: any) => (v ? formatBalance(v, 2, currency) : ''),
      },
      {
        name: '\u00A0 \u00A0 Onchain reserve',
        value: poolStates?.map((poolState) => poolState.onchainReserve.toDecimal()) || [],
        heading: false,
        formatter: (v: any) => (v ? formatBalance(v, 2, currency) : ''),
      },
      {
        name: '\u00A0 \u00A0 Offchain cash',
        value: poolStates?.map((poolState) => poolState.offchainCash.toDecimal()) || [],
        heading: false,
        formatter: (v: any) => (v ? formatBalance(v, 2, currency) : ''),
      },
      {
        name: '\u00A0 \u00A0 Accrued fees',
        value: poolStates?.map((poolState) => poolState.accruedFees.toDecimal().neg()) || [],
        heading: false,
        formatter: (v: any) => (v ? formatBalance(v, 2, currency) : ''),
      },
      {
        name: 'Net Asset Value (NAV)',
        value: poolStates?.map((poolState) => poolState.netAssetValue.toDecimal()) || [],
        heading: true,
        formatter: (v: any) => (v ? formatBalance(v, 2, currency) : ''),
      },
    ]
  }, [currency, poolStates])

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
              value:
                poolStates?.map((poolState) => {
                  const tokenSupply = poolState?.tranches?.find((state) => state.tokenId === token.id)?.tokenSupply
                  return tokenSupply || ('' as any)
                }) || [],
              heading: false,
              formatter: (v: any) => (v ? formatBalance(v, 2, token.currency.displayName) : ''),
            },
            {
              name: `\u00A0 \u00A0 * ${token.currency.displayName} token price`,
              value:
                poolStates?.map((poolState) => {
                  const tokenPrice = poolState?.tranches?.find((state) => state.tokenId === token.id)?.tokenPrice
                  return tokenPrice || ('' as any)
                }) || [],
              heading: false,
              formatter: (v: any) => (v ? formatBalance(v, 6, token.currency.displayName) : ''),
            },
            {
              name: `\u00A0 \u00A0 = ${token.currency.displayName} tranche value`,
              value:
                poolStates?.map((poolState) => {
                  const trancheVal = poolState?.tranches?.find((state) => state.tokenId === token.id)?.trancheValue
                  return trancheVal || ('' as any)
                }) || [],
              heading: false,
              bold: true,
              formatter: (v: any) => (v ? formatBalance(v, 2, token.currency.displayName) : ''),
            },
          ]
        })
        .flat() || []),
      {
        name: 'Total capital',
        value: poolStates?.map((poolState) => poolState.totalCapital?.toDecimal() || ('' as any)) || [],
        heading: true,
        formatter: (v: any) => (v ? formatBalance(v, 2, currency) : ''),
      },
    ]
  }, [poolStates, pool, currency])

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

  if (isLoading) {
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
