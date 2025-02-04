import { Pool } from '@centrifuge/centrifuge-js/dist/modules/pools'
import { Box, Text } from '@centrifuge/fabric'
import { useContext, useEffect, useMemo } from 'react'
import { TableDataRow } from '.'
import { formatDateAndTime } from '../../../src/utils/date'
import { formatDecimal } from '../../../src/utils/formatting'
import { getCSVDownloadUrl } from '../../../src/utils/getCSVDownloadUrl'
import { DataTable, SortableTableHeader } from '../DataTable'
import { Spinner } from '../Spinner'
import { ReportContext } from './ReportContext'
import { useReport } from './useReportsQuery'
import { convertCSV } from './utils'

const noop = (v: any) => v

const Orders = ({ pool }: { pool: Pool }) => {
  const { setCsvData, startDate, endDate } = useContext(ReportContext)

  const { data: orders = [], isLoading } = useReport('ordersList', pool, new Date(startDate), new Date(endDate))

  const columnsConfig = [
    {
      align: 'left',
      header: 'Epoch',
      formatter: noop,
      sortable: true,
    },
    {
      align: 'left',
      header: 'Date & Time',
      sortable: true,
      formatter: (v: any) => (v ? formatDateAndTime(v) : '-'),
      width: '200px',
    },
    {
      align: 'left',
      header: 'NAV',
      sortable: true,
      formatter: (v: any) => (v ? formatDecimal(v, 6, pool.currency.symbol) : '-'),
    },
    {
      align: 'left',
      header: 'Nav per share',
      sortable: true,
      formatter: (v: any) => (v ? formatDecimal(v, 6, pool.currency.symbol) : '-'),
    },
    {
      align: 'left',
      header: 'Investments locked',
      sortable: true,
      formatter: (v: any) => (v ? formatDecimal(v, 2, pool.currency.symbol) : '-'),
    },
    {
      align: 'left',
      header: 'Investments executed',
      sortable: true,
      formatter: (v: any) => (v ? formatDecimal(v, 2, pool.currency.symbol) : '-'),
    },
    {
      align: 'left',
      header: 'Redemptions locked',
      sortable: true,
      formatter: (v: any) => (v ? formatDecimal(v, 2, pool.currency.symbol) : '-'),
    },
    {
      align: 'left',
      header: 'Redemptions executed',
      sortable: true,
      formatter: (v: any) => (v ? formatDecimal(v, 2, pool.currency.symbol) : '-'),
    },
    {
      align: 'left',
      header: 'Paid fees',
      sortable: true,
      formatter: (v: any) => (v ? formatDecimal(v, 2, pool.currency.symbol) : '-'),
    },
  ]

  const columns = columnsConfig.map((col, index) => ({
    align: col.align,
    header: col.sortable ? <SortableTableHeader label={col.header} /> : col.header,
    cell: (row: TableDataRow) => {
      return <Text variant="body3">{col.formatter((row.value as any)[index])}</Text>
    },
    sortKey: col.sortable ? `value[${index}]` : undefined,
    width: col.width,
  }))

  const data = useMemo(() => {
    if (!orders?.length) return []
    else {
      return orders.map((order) => {
        return {
          name: '',
          value: [
            order.epoch,
            order.timestamp,
            order.netAssetValue,
            order.navPerShare,
            order.lockedInvestments,
            order.executedInvestments,
            order.lockedRedemptions,
            order.executedRedemptions,
            order.paidFees,
          ],
          heading: false,
        }
      })
    }
  }, [orders])

  const dataUrl = useMemo(() => {
    if (!data.length) {
      return
    }

    const formatted = data.map(({ value: values }) => convertCSV(values, columnsConfig))

    return getCSVDownloadUrl(formatted)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  useEffect(() => {
    setCsvData(
      dataUrl
        ? {
            dataUrl,
            fileName: `${pool.id}-orders.csv`,
          }
        : undefined
    )

    return () => setCsvData(undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataUrl, pool.id])

  if (isLoading) return <Spinner />

  return (
    <Box paddingX={2}>
      <DataTable data={data} columns={columns} scrollable defaultSortKey="value[1]" defaultSortOrder="desc" />
    </Box>
  )
}

export default Orders
