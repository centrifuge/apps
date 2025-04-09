import { Pool } from '@centrifuge/centrifuge-js/dist/modules/pools'
import { Text } from '@centrifuge/fabric'
import * as React from 'react'
import { formatDate } from '../../utils/date'
import { formatBalance, formatPercentage } from '../../utils/formatting'
import { getCSVDownloadUrl } from '../../utils/getCSVDownloadUrl'
import { DataTable } from '../DataTable'
import { useDebugFlags } from '../DebugFlags'
import { Spinner } from '../Spinner'
import { ReportContext } from './ReportContext'
import { UserFeedback } from './UserFeedback'
import type { TableDataRow } from './index'
import { useReport } from './useReportsQuery'

type Row = TableDataRow & {
  formatter?: (v: any) => any
}

export function TokenPrice({ pool }: { pool: Pool }) {
  const { startDate, endDate, groupBy, setCsvData } = React.useContext(ReportContext)
  const { showTokenYields } = useDebugFlags()

  const { data: poolStates = [], isLoading } = useReport(
    'tokenPrice',
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
        header: 'Type',
        cell: (row: TableDataRow) => <Text variant={row.heading ? 'heading4' : 'body3'}>{row.name}</Text>,
        width: '200px',
      },
    ]
      .concat(
        poolStates.map((state, index) => ({
          align: 'right',
          timestamp: state?.timestamp,
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
  }, [poolStates, groupBy])

  const priceRecords: Row[] = React.useMemo(() => {
    return [
      {
        name: 'Token price',
        value: poolStates?.map(() => '' as any) || [],
        heading: false,
      },
      ...(pool?.tranches
        .slice()
        .reverse()
        .map((token) => ({
          name: `\u00A0 \u00A0 ${token.currency.displayName} token`,
          value:
            poolStates?.map((state) => {
              const matchingTranche = state.tranches.find((t) => t.id === token.id)
              return matchingTranche?.price.toFloat() ?? 1
            }) || [],
          heading: false,
          formatter: (v: any) => formatBalance(v, pool.currency.symbol, 6),
        })) || []),
      {
        name: 'Token supply',
        value: poolStates?.map(() => '' as any) || [],
        heading: false,
      },
      ...(pool?.tranches
        .slice()
        .reverse()
        .map((token) => ({
          name: `\u00A0 \u00A0 ${token.currency.displayName} token`,
          value:
            poolStates?.map((state) => {
              const matchingTranche = state.tranches.find((t) => t.id === token.id)
              return matchingTranche?.supply.toFloat() ?? 0
            }) || [],
          heading: false,
          formatter: (v: any) => formatBalance(v, '', 2),
        })) || []),
      ...(!!showTokenYields
        ? [
            {
              name: 'Yield since inception',
              value: poolStates?.map(() => '' as any) || [],
              heading: false,
            },
          ]
        : []),
      ...(!!showTokenYields
        ? pool?.tranches
            .slice()
            .reverse()
            .map((token) => ({
              name: `\u00A0 \u00A0 ${token.currency.displayName} token`,
              value:
                poolStates?.map((state) => {
                  const matchingTranche = state.tranches.find((t) => t.id === token.id)
                  return matchingTranche?.yieldSinceInception?.toFloat() ?? 0
                }) || [],
              heading: false,
              formatter: (v: any) => formatPercentage(v * 100, true, {}, 2),
            }))
        : []),
      ...(!!showTokenYields
        ? [
            {
              name: 'Yield MTD',
              value: poolStates?.map(() => '' as any) || [],
              heading: false,
            },
          ]
        : []),
      ...(!!showTokenYields
        ? pool?.tranches
            .slice()
            .reverse()
            .map((token) => ({
              name: `\u00A0 \u00A0 ${token.currency.displayName} token`,
              value:
                poolStates?.map((state) => {
                  const matchingTranche = state.tranches.find((t) => t.id === token.id)
                  return matchingTranche?.yieldMTD?.toFloat() ?? 0
                }) || [],
              heading: false,
              formatter: (v: any) => formatPercentage(v * 100, true, {}, 2),
            }))
        : []),
      ...(!!showTokenYields
        ? pool?.tranches
            .slice()
            .reverse()
            .map((token) => ({
              name: `\u00A0 \u00A0 ${token.currency.displayName} token`,
              value:
                poolStates?.map((state) => {
                  const matchingTranche = state.tranches.find((t) => t.id === token.id)
                  return matchingTranche?.yieldQTD?.toFloat() ?? 0
                }) || [],
              heading: false,
              formatter: (v: any) => formatPercentage(v * 100, true, {}, 2),
            }))
        : []),
      ...(!!showTokenYields
        ? [
            {
              name: 'Yield YTD',
              value: poolStates?.map(() => '' as any) || [],
              heading: false,
            },
          ]
        : []),
      ...(!!showTokenYields
        ? pool?.tranches
            .slice()
            .reverse()
            .map((token) => ({
              name: `\u00A0 \u00A0 ${token.currency.displayName} token`,
              value:
                poolStates?.map((state) => {
                  const matchingTranche = state.tranches.find((t) => t.id === token.id)
                  return matchingTranche?.yieldYTD?.toFloat() ?? 0
                }) || [],
              heading: false,
              formatter: (v: any) => formatPercentage(v * 100, true, {}, 2),
            }))
        : []),
      ...(!!showTokenYields
        ? [
            {
              name: '7d APY',
              value: poolStates?.map(() => '' as any) || [],
              heading: false,
            },
          ]
        : []),
      ...(!!showTokenYields
        ? pool?.tranches
            .slice()
            .reverse()
            .map((token) => ({
              name: `\u00A0 \u00A0 ${token.currency.displayName} token`,
              value:
                poolStates?.map((state) => {
                  const matchingTranche = state.tranches.find((t) => t.id === token.id)
                  return matchingTranche?.yield7daysAnnualized?.toFloat() ?? 0
                }) || [],
              heading: false,
              formatter: (v: any) => formatPercentage(v * 100, true, {}, 2),
            }))
        : []),
      ...(!!showTokenYields
        ? [
            {
              name: '30d APY',
              value: poolStates?.map(() => '' as any) || [],
              heading: false,
            },
          ]
        : []),
      ...(!!showTokenYields
        ? pool?.tranches
            .slice()
            .reverse()
            .map((token) => ({
              name: `\u00A0 \u00A0 ${token.currency.displayName} token`,
              value:
                poolStates?.map((state) => {
                  const matchingTranche = state.tranches.find((t) => t.id === token.id)
                  return matchingTranche?.yield30daysAnnualized?.toFloat() ?? 0
                }) || [],
              heading: false,
              formatter: (v: any) => formatPercentage(v * 100, true, {}, 2),
            }))
        : []),
      ...(!!showTokenYields
        ? [
            {
              name: '90d APY',
              value: poolStates?.map(() => '' as any) || [],
              heading: false,
            },
          ]
        : []),
      ...(!!showTokenYields
        ? pool?.tranches
            .slice()
            .reverse()
            .map((token) => ({
              name: `\u00A0 \u00A0 ${token.currency.displayName} token`,
              value:
                poolStates?.map((state) => {
                  const matchingTranche = state.tranches.find((t) => t.id === token.id)
                  return matchingTranche?.yield90daysAnnualized?.toFloat() ?? 0
                }) || [],
              heading: false,
              formatter: (v: any) => formatPercentage(v * 100, true, {}, 2),
            }))
        : []),
    ]
  }, [poolStates, pool, showTokenYields])

  const headers = columns.slice(0, -1).map(({ header }) => header)

  React.useEffect(() => {
    const f = priceRecords.map(({ name, value }) => [name.trim(), ...(value as string[])])
    let formatted = f.map((values) =>
      Object.fromEntries(headers.map((_, index) => [`"${headers[index]}"`, `"${values[index]}"`]))
    )

    if (!formatted.length) {
      return
    }

    const dataUrl = getCSVDownloadUrl(formatted)

    if (!dataUrl) {
      throw new Error('Failed to create CSV')
    }

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
      URL.revokeObjectURL(dataUrl || '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priceRecords])

  if (isLoading) {
    return <Spinner />
  }

  return poolStates?.length > 0 ? (
    <DataTable data={priceRecords} columns={columns} hoverable scrollable />
  ) : (
    <UserFeedback reportType="Token price" />
  )
}
