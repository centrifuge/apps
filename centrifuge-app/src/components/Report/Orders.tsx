import { Pool } from '@centrifuge/centrifuge-js/dist/modules/pools'
import { Box, Text } from '@centrifuge/fabric'
import { useContext, useEffect, useMemo } from 'react'
import { TableDataRow } from '.'
import { formatDateAndTime } from '../../../src/utils/date'
import { formatBalance } from '../../../src/utils/formatting'
import { getCSVDownloadUrl } from '../../../src/utils/getCSVDownloadUrl'
import { usePoolOrdersByPoolId } from '../../../src/utils/usePools'
import { DataTable, SortableTableHeader } from '../DataTable'
import { ReportContext } from './ReportContext'
import { convertCSV } from './utils'

const noop = (v: any) => v

const Orders = ({ pool }: { pool: Pool }) => {
  const { setCsvData } = useContext(ReportContext)
  const orders = usePoolOrdersByPoolId(pool.id)

  const columnsConfig = [
    {
      align: 'left',
      header: 'Epoch',
      sortable: true,
      formatter: noop,
    },
    {
      align: 'left',
      header: 'Date & Time',
      sortable: true,
      formatter: (v: any) => formatDateAndTime(v),
      width: '200px',
    },
    {
      align: 'left',
      header: 'NAV',
      sortable: true,
      formatter: (v: any) => (v ? formatBalance(v) : '-'),
    },
    {
      align: 'left',
      header: 'Nav per share',
      sortable: true,
      formatter: (v: any) => (v ? formatBalance(v) : '-'),
    },
    {
      align: 'left',
      header: 'Investments locked',
      sortable: true,
      formatter: (v: any) => (v ? formatBalance(v, pool.currency.symbol, 2) : '-'),
    },
    {
      align: 'left',
      header: 'Investments executed',
      sortable: true,
      formatter: (v: any) => (v ? formatBalance(v, pool.currency.symbol, 2) : '-'),
    },
    {
      align: 'left',
      header: 'Redemptions locked',
      sortable: true,
      formatter: (v: any) => (v ? formatBalance(v, pool.currency.symbol, 2) : '-'),
    },
    {
      align: 'left',
      header: 'Redemptions executed',
      sortable: true,
      formatter: (v: any) => (v ? formatBalance(v, pool.currency.symbol, 2) : '-'),
    },
    {
      align: 'left',
      header: 'Paid fees',
      sortable: true,
      formatter: (v: any) => (v ? formatBalance(v, pool.currency.symbol, 2) : '-'),
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
      return orders.map((order) => ({
        name: '',
        value: [
          order.epochId,
          order.closedAt,
          order.netAssetValue,
          order.tokenPrice,
          order.sumOutstandingInvestOrders,
          order.sumFulfilledInvestOrders,
          order.sumOutstandingRedeemOrders,
          order.sumFulfilledRedeemOrders,
          order.paidFees,
        ],
        heading: false,
      }))
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

  return (
    <Box paddingX={2}>
      <DataTable data={data} columns={columns} scrollable />
    </Box>
  )
}

export default Orders
