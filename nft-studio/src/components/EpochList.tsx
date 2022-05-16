import { Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useParams } from 'react-router'
import { formatBalance } from '../utils/formatting'
import { usePool } from '../utils/usePools'
import { Column, DataTable, SortableTableHeader } from './DataTable'

type Props = {
  investments: any[]
  redmetions: any[]
}

export const EpochList: React.FC<Props> = ({ investments, redmetions }) => {
  const columns: Column[] = [
    {
      align: 'left',
      header: () => <SortableTableHeader label="Order" />,
      cell: (row: any) => <Text>{row.order}</Text>,
      sortKey: 'order',
      flex: '1',
    },
    {
      header: 'Locked',
      cell: (row: any) => <LockedRow row={row} />,
      flex: '1',
    },
  ]

  return (
    <Stack gap="3">
      <DataTable data={investments} columns={columns} />
      <DataTable data={redmetions} columns={columns} />
    </Stack>
  )
}

const LockedRow: React.VFC<{ row: any }> = ({ row }) => {
  const { pid: poolId } = useParams<{ pid: string }>()
  const pool = usePool(poolId)
  return <Text variant="body2">{formatBalance(row.locked, pool?.currency)}</Text>
}
