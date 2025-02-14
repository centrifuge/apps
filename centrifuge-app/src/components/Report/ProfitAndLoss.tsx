import { Pool } from '@centrifuge/centrifuge-js/dist/modules/pools'
import { Text, Tooltip } from '@centrifuge/fabric'
import { Currency } from '@centrifuge/sdk'
import { ProfitAndLossReport } from '@centrifuge/sdk/dist/types/reports'
import * as React from 'react'
import { formatDate } from '../../../src/utils/date'
import { formatBalance } from '../../../src/utils/formatting-sdk'
import { getCSVDownloadUrl } from '../../../src/utils/getCSVDownloadUrl'
import { usePoolMetadata } from '../../utils/usePools'
import { DataTable } from '../DataTable'
import { DataTableGroup } from '../DataTableGroup'
import { Spinner } from '../Spinner'
import { ReportContext } from './ReportContext'
import { UserFeedback } from './UserFeedback'
import type { TableDataRow } from './index'
import { useReport } from './useReportsQuery'
import { getColumnHeader } from './utils'

type Row = TableDataRow & {
  formatter?: (v: any) => any
  nameTooltip?: string
  bold?: boolean
}

export function ProfitAndLoss({ pool }: { pool: Pool }) {
  const { startDate, endDate, groupBy, setCsvData, setReportData } = React.useContext(ReportContext)
  const { data: poolMetadata } = usePoolMetadata(pool)
  const { data = [], isLoading } = useReport('profitAndLoss', pool, new Date(startDate), new Date(endDate), groupBy)
  const currency = pool.currency.displayName

  const columns = React.useMemo(() => {
    if (!data.length) {
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
        isLabel: true,
      },
    ]
      .concat(
        data.map((state, index) => ({
          align: 'right',
          timestamp: state?.timestamp,
          header: getColumnHeader(state?.timestamp, groupBy),
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
  }, [data, groupBy])

  const profitAndLossPublicRecords: Row[] = React.useMemo(() => {
    return [
      {
        name: 'Income',
        value: data?.map(() => '' as any) || [],
        heading: false,
        bold: true,
      },
      {
        name: 'Profit / loss from assets',
        nameTooltip: 'Based on selling the assets in the pool at the current market price',
        value: data?.map((report) => report.profitAndLossFromAsset.toDecimal()) || [],
        heading: false,
        formatter: (v: any) => (v ? formatBalance(v, 2, currency) : ''),
      },
      {
        name: 'Interest payments',
        value: data?.map((report) => report.interestPayments.toDecimal()) || [],
        heading: false,
        formatter: (v: any) => (v ? formatBalance(v, 2, currency) : ''),
      },
      {
        name: 'Other payments',
        value: data?.map((report) => report.otherPayments.toDecimal()) || [],
        heading: false,
        formatter: (v: any) => (v ? formatBalance(v, 2, currency) : ''),
      },
      {
        name: 'Total income ',
        value: data.map((report) => {
          if (report.subtype === 'publicCredit') {
            return report.totalIncome.toDecimal()
          }
          return 0
        }),
        heading: false,
        bold: true,
        formatter: (v: any) => (v ? formatBalance(v, 2, currency) : ''),
      },
    ]
  }, [currency, data])

  const profitAndLossPrivateRecords: Row[] = React.useMemo(() => {
    return [
      {
        name: 'Income',
        value: data?.map(() => '' as any) || [],
        heading: false,
        bold: true,
      },
      {
        name: 'Interest payments',
        value: data?.map((report) => report.interestPayments?.toDecimal()) || [],
        heading: false,
        formatter: (v: any) => (v ? formatBalance(v, 2, currency) : ''),
      },
      {
        name: 'Interest accrued',
        value: data?.map((report) => report.interestPayments.toDecimal()) || [],
        heading: false,
        formatter: (v: any) => `${v.isZero() ? '' : '-'}${formatBalance(v, 2, currency)}`,
      },
      {
        name: 'Other payments',
        value: data?.map((report) => report.otherPayments.toDecimal()) || [],
        heading: false,
        formatter: (v: any) => (v ? formatBalance(v, 2, currency) : ''),
      },
      {
        name: 'Asset write-offs',
        value:
          data?.map((report) => {
            if (report.subtype !== 'privateCredit') {
              return 0
            }
            return report.assetWriteOffs.toDecimal()
          }) || [],
        heading: false,
        formatter: (v: any) => (v ? `-${formatBalance(v, 2, currency)}` : ''),
      },
      {
        name: 'Profit / loss from assets ',
        value: data.map((report) => report.totalProfitAndLoss.toDecimal()),
        heading: false,
        bold: true,
        formatter: (v: any) => (v ? formatBalance(v, 2, currency) : ''),
      },
    ]
  }, [currency, data])

  const profitAndLossRecords =
    poolMetadata?.pool?.asset.class === 'Private credit' ? profitAndLossPrivateRecords : profitAndLossPublicRecords

  const feesRecords = React.useMemo(() => {
    if (!data?.length) return []

    const rows: Row[] = [
      {
        name: 'Expenses',
        value: data.map(() => ''),
        heading: false,
        bold: true,
      },
    ]

    const feeMap: Record<string, { name: string; amount: Currency[] }> = {}

    data.forEach((report, periodIndex) => {
      const zeroCurrency = Currency.fromFloat(0, pool.currency.decimals)
      report.fees.forEach((fee) => {
        if (!feeMap[fee.feeId]) {
          feeMap[fee.feeId] = {
            name: fee.name,
            amount: new Array(data.length).fill(zeroCurrency),
          }
        }
        feeMap[fee.feeId].amount[periodIndex] = feeMap[fee.feeId].amount[periodIndex].add(fee.amount)
      })
    })

    Object.entries(feeMap).forEach(([feeId, { name, amount }]) => {
      rows.push({
        name,
        value: amount.map((amt) => amt.toDecimal()),
        heading: false,
        bold: false,
        formatter: (v: Currency) => {
          return `-${formatBalance(v, 2, pool.currency.displayName)}`
        },
      })
    })

    rows.push({
      name: 'Total expenses',
      value: data.map((report) => report.totalExpenses.toDecimal()),
      heading: false,
      bold: true,
      formatter: (val: any) => (val ? formatBalance(val, 2, pool.currency.displayName) : ''),
    })

    return rows
  }, [data, pool.currency.displayName, pool.currency.decimals])

  const totalProfitRecords: Row[] = React.useMemo(() => {
    return [
      {
        name: 'Total profit / loss',
        value: data?.map((report) => report.totalProfitAndLoss.toDecimal()) || [],
        heading: true,
        formatter: (v: any) => `${formatBalance(v, 2, pool.currency.displayName)}`,
      },
    ]
  }, [data, pool.currency.displayName])

  const headers = columns.slice(0, -1).map(({ header }) => header)

  React.useEffect(() => {
    const f = [...profitAndLossRecords, ...feesRecords, ...totalProfitRecords].map(({ name, value }) => [
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
      throw new Error('Failed to create CSV')
    }

    setCsvData({
      dataUrl,
      fileName: `${pool.id}-profit-and-loss-${formatDate(startDate, {
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
  }, [profitAndLossRecords, feesRecords, totalProfitRecords])

  React.useEffect(() => {
    if (data && data.length > 0) {
      const fullPoolStates: ProfitAndLossReport[] = data.map((partialState) => ({
        ...partialState,
      })) as ProfitAndLossReport[]

      setReportData(fullPoolStates)
    }
  }, [data, setReportData])

  if (isLoading) return <Spinner />

  return data?.length > 0 ? (
    <DataTableGroup>
      <DataTable data={profitAndLossRecords} columns={columns} hoverable />
      <DataTable data={feesRecords} columns={columns} hoverable />
      <DataTable data={totalProfitRecords} columns={columns} hoverable />
    </DataTableGroup>
  ) : (
    <UserFeedback reportType="Profit and loss" />
  )
}
