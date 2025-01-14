import { Pool } from '@centrifuge/centrifuge-js/dist/modules/pools'
import { Box, Text } from '@centrifuge/fabric'
import { useMemo } from 'react'
import { TableDataRow } from '.'
import { formatDateAndTime } from '../../../src/utils/date'
import { formatBalance } from '../../../src/utils/formatting'
import { usePoolOrdersByPoolId } from '../../../src/utils/usePools'
import { DataTable, SortableTableHeader } from '../DataTable'

const noop = (v: any) => v

const Orders = ({ pool }: { pool: Pool }) => {
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
      formatter: (v: any) => (v ? formatBalance(v, undefined, pool.currency.decimals) : '-'),
    },
    {
      align: 'left',
      header: 'Nav per share',
      sortable: true,
      formatter: (v: any) => (v ? formatBalance(v, undefined, pool.currency.decimals) : '-'),
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

  return (
    <Box paddingX={2}>
      <DataTable data={data} columns={columns} scrollable />
    </Box>
  )
}

export default Orders
