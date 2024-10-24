import { Pool } from '@centrifuge/centrifuge-js/dist/modules/pools'
import { Box, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { formatDate } from '../../utils/date'
import { formatBalance, formatPercentage } from '../../utils/formatting'
import { getCSVDownloadUrl } from '../../utils/getCSVDownloadUrl'
import { useDailyPoolStates, usePoolStatesByGroup } from '../../utils/usePools'
import { DataTable } from '../DataTable'
import { useDebugFlags } from '../DebugFlags'
import { Spinner } from '../Spinner'
import { ReportContext } from './ReportContext'
import { UserFeedback } from './UserFeedback'
import type { TableDataRow } from './index'

type Row = TableDataRow & {
  formatter?: (v: any) => any
}

export function TokenPrice({ pool }: { pool: Pool }) {
  const { startDate, endDate, groupBy, setCsvData } = React.useContext(ReportContext)
  const { showTokenYields } = useDebugFlags()

  const { poolStates: dailyPoolStates } =
    useDailyPoolStates(pool.id, startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined) ||
    {}
  const monthlyPoolStates = usePoolStatesByGroup(
    pool.id,
    startDate ? new Date(startDate) : undefined,
    endDate ? new Date(endDate) : undefined,
    'month'
  )
  const poolStates = groupBy === 'day' || groupBy === 'daily' ? dailyPoolStates : monthlyPoolStates

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
            poolStates?.map((state) =>
              state.tranches[token.id]?.price ? state.tranches[token.id].price!.toFloat() : 1
            ) || [],
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
          value: poolStates?.map((state) => state.tranches[token.id].tokenSupply.toFloat()) || [],
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
              value: poolStates?.map((state) => state.tranches[token.id].yieldSinceInception.toFloat()) || [],
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
              value: poolStates?.map((state) => state.tranches[token.id].yieldMTD.toFloat()) || [],
              heading: false,
              formatter: (v: any) => formatPercentage(v * 100, true, {}, 2),
            }))
        : []),
      ...(!!showTokenYields
        ? [
            {
              name: 'Yield QTD',
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
              value: poolStates?.map((state) => state.tranches[token.id].yieldQTD.toFloat()) || [],
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
              value: poolStates?.map((state) => state.tranches[token.id].yieldYTD.toFloat()) || [],
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
              value: poolStates?.map((state) => state.tranches[token.id].yield7DaysAnnualized.toFloat()) || [],
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
              value: poolStates?.map((state) => state.tranches[token.id].yield30DaysAnnualized.toFloat()) || [],
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
              value: poolStates?.map((state) => state.tranches[token.id].yield90DaysAnnualized.toFloat()) || [],
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

  if (!poolStates) {
    return <Spinner mt={2} />
  }

  return poolStates?.length > 0 ? (
    <Box paddingX={2}>
      <DataTable data={priceRecords} columns={columns} hoverable scrollable />
    </Box>
  ) : (
    <UserFeedback reportType="Token price" />
  )
}
