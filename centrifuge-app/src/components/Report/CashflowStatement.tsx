import { Pool } from '@centrifuge/centrifuge-js/dist/modules/pools'
import { formatBalance } from '@centrifuge/centrifuge-react'
import { Text, Tooltip } from '@centrifuge/fabric'
import Centrifuge from '@centrifuge/sdk'
import * as React from 'react'
import { useQuery } from 'react-query'
import { formatDate } from '../../utils/date'
import { getCSVDownloadUrl } from '../../utils/getCSVDownloadUrl'
import { usePoolMetadata } from '../../utils/usePools'
import { DataTable } from '../DataTable'
import { DataTableGroup } from '../DataTableGroup'
import { Spinner } from '../Spinner'
import { ReportContext } from './ReportContext'
import { UserFeedback } from './UserFeedback'
import type { TableDataRow } from './index'
import { getColumnHeader } from './utils'

type Row = TableDataRow & {
  formatter?: (v: any) => any
  nameTooltip?: string
  bold?: boolean
}

const centrifuge = new Centrifuge({
  environment: 'mainnet',
  indexerUrl: 'https://api.centrifuge.io/',
})

export function CashflowStatement({ pool }: { pool: Pool }) {
  const { startDate, endDate, groupBy, setCsvData, setReportData } = React.useContext(ReportContext)
  const { data: poolMetadata } = usePoolMetadata(pool)

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

  const { data } = useQuery({
    queryKey: ['cashflow', pool.id, startDate, endDate, groupBy],
    queryFn: async () => {
      const sdkPool = await centrifuge.pool(pool.id, pool.metadata)
      const group = groupBy === 'day' || groupBy === 'daily' ? 'day' : groupBy
      const report = await sdkPool.reports.cashflow({
        from: adjustedStartDate.toISOString(),
        to: adjustedEndDate.toISOString(),
        groupBy: group,
      })
      if (groupBy === 'day') {
        return [report?.[0]]
      }
      return report
    },
    enabled: !!pool.id,
  })

  const columns = React.useMemo(() => {
    if (!data || !data.length) {
      return []
    }

    return [
      {
        align: 'left',
        header: '',
        cell: (row: Row) =>
          row.nameTooltip ? (
            <Tooltip body={row.nameTooltip}>
              <Text variant={row.heading ? 'heading4' : row.bold ? 'interactive2' : 'body3'}>{row.name}</Text>
            </Tooltip>
          ) : (
            <Text variant={row.heading ? 'heading4' : row.bold ? 'interactive2' : 'body3'}>{row.name}</Text>
          ),
        width: '240px',
      },
    ]
      .concat(
        data?.map((state, index) => ({
          align: 'right',
          timestamp: state.timestamp,
          header: getColumnHeader(state.timestamp, groupBy),
          cell: (row: Row) => (
            <Text variant={row.heading ? 'heading4' : row.bold ? 'interactive2' : 'body3'}>
              {row.formatter ? row.formatter((row.value as any)[index]) : (row.value as any)[index]}
            </Text>
          ),
          width: '170px',
        })) || []
      )
      .concat({
        align: 'left',
        header: '',
        cell: () => <span />,
        width: '1fr',
      })
  }, [data, groupBy])

  const grossCashflowRecords: Row[] = React.useMemo(() => {
    return [
      {
        name: 'Principal payments',
        value: data?.map((day) => day.principalPayments.toDecimal()) || [],
        heading: false,
        formatter: (v: any) => (v ? formatBalance(v, pool.currency.displayName, 2) : ''),
      },
      ...(poolMetadata?.pool?.asset.class === 'Public credit'
        ? [
            {
              name: 'Realized profit / loss',
              nameTooltip: 'Based on first-in, first-out calculation of the transactions of each individual asset',
              value: data?.map((day) => (day.subtype === 'publicCredit' ? day?.realizedPL?.toDecimal() : 0)) || [],
              heading: false,
              formatter: (v: any) => (v ? formatBalance(v, pool.currency.displayName, 2) : ''),
            },
            {
              name: 'Asset financings',
              value:
                data?.map((day) => (day.subtype === 'privateCredit' ? day?.assetFinancing?.toDecimal().neg() : 0)) ||
                [],
              heading: false,
              formatter: (v: any) => `${formatBalance(v, pool.currency.displayName, 2)}`,
            },
          ]
        : []),
      {
        name: 'Interest payments',
        value: data?.map((day) => day.interestPayments.toDecimal()) || [],
        heading: false,
        formatter: (v: any) => (v ? formatBalance(v, pool.currency.displayName, 2) : ''),
      },
      ...(poolMetadata?.pool?.asset.class === 'Public credit'
        ? [
            {
              name: 'Asset financings',
              value:
                data?.map((day) => (day.subtype === 'publicCredit' ? day?.assetPurchases?.toDecimal().neg() : 0)) || [],
              heading: false,
              formatter: (v: any) => `${formatBalance(v, pool.currency.displayName, 2)}`,
            },
          ]
        : [
            {
              name: 'Asset purchases',
              value:
                data?.map((day) => (day.subtype === 'privateCredit' ? day?.assetFinancing?.toDecimal().neg() : 0)) ||
                [],
              heading: false,
              formatter: (v: any) => `${formatBalance(v, pool.currency.displayName, 2)}`,
            },
          ]),
      {
        name: 'Net cash flow from assets',
        value: data?.map((state) => state.netCashflowAsset.toDecimal()) || [],
        heading: false,
        bold: true,
        formatter: (v: any) => (v ? formatBalance(v, pool.currency.displayName, 2) : ''),
      },
    ]
  }, [pool.currency.displayName, poolMetadata?.pool?.asset.class, data])

  const netCashflowRecords: Row[] = React.useMemo(() => {
    const feeRows =
      data?.reduce<Row[]>((acc, state, stateIndex) => {
        state.fees.forEach((fee) => {
          const existingFee = acc.find((row) => row.name === fee.name)

          if (existingFee) {
            ;(existingFee.value as any[])[stateIndex] = fee.amount.toDecimal().neg()
          } else {
            acc.push({
              name: fee.name,
              value: Array(data.length)
                .fill(null)
                .map((_, i) => (i === stateIndex ? fee.amount.toDecimal().neg() : 0)),
              formatter: (v: any) => (v ? formatBalance(v || 0, pool.currency.displayName, 2) : 'n/a'),
            })
          }
        })
        return acc
      }, []) ?? []

    return [
      ...feeRows,
      {
        name: 'Net cash flow after fees',
        value: data?.map((state) => state.netCashflowAfterFees.toDecimal()) || [],
        formatter: (v: any) => (v ? formatBalance(v, pool.currency.displayName, 2) : ''),
        heading: false,
        bold: true,
      },
    ]
  }, [data, pool.currency.displayName])

  const investRedeemRecords: Row[] = React.useMemo(() => {
    return [
      {
        name: 'Pool investments',
        value: data?.map((state) => state.investments.toDecimal()) || [],
        heading: false,
        formatter: (v: any) => (v ? formatBalance(v, pool.currency.displayName, 2) : ''),
      },
      {
        name: 'Pool redemptions',
        value: data?.map((state) => state.redemptions.toDecimal().neg()) || [],
        heading: false,
        formatter: (v: any) => `${formatBalance(v, pool.currency.displayName, 2)}`,
      },
      {
        name: 'Cash flow from investment activities',
        value: data?.map((state) => state.activitiesCashflow.toDecimal()) || [],
        formatter: (v: any) => (v ? formatBalance(v, pool.currency.displayName, 2) : ''),
        heading: false,
        bold: true,
      },
    ]
  }, [data, pool.currency.displayName])

  const endCashflowRecords = React.useMemo(() => {
    return [
      {
        name: 'Total cash flow',
        value: data?.map((state) => state.totalCashflow.toDecimal()) || [],
        heading: true,
        formatter: (v: any) => (v ? formatBalance(v, pool.currency.displayName, 2) : ''),
      },
      {
        name: 'End cash balance',
        value: data?.map((state) => state.endCashBalance.balance.toDecimal()) || [],
        bold: true,
        formatter: (v: any) => (v ? formatBalance(v, pool.currency.displayName, 2) : ''),
      },
    ]
  }, [data, pool.currency.displayName])

  const headers = columns.slice(0, -1).map(({ header }) => header)

  React.useEffect(() => {
    const f = [...grossCashflowRecords, ...netCashflowRecords, ...investRedeemRecords].map(({ name, value }) => [
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
      fileName: `${pool.id}-cash-flow-statement-${formatDate(startDate, {
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
  }, [grossCashflowRecords, netCashflowRecords])

  if (!data) {
    return <Spinner mt={2} />
  }

  return data?.length > 0 ? (
    <DataTableGroup>
      <DataTable data={grossCashflowRecords} columns={columns} hoverable />
      <DataTable data={netCashflowRecords} columns={columns} hoverable />
      <DataTable data={investRedeemRecords} columns={columns} hoverable />
      <DataTable data={endCashflowRecords} columns={columns} hoverable />
    </DataTableGroup>
  ) : (
    <UserFeedback reportType="Cash flow statement" />
  )
}
