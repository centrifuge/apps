import { Balance, DetailedPool } from '@centrifuge/centrifuge-js'
import { Stack, Text } from '@centrifuge/fabric'
import Decimal from 'decimal.js-light'
import * as React from 'react'
import { useParams } from 'react-router'
import { formatBalance } from '../utils/formatting'
import { usePool, usePoolMetadata } from '../utils/usePools'
import { Column, DataTable } from './DataTable'
import { DataTableGroup } from './DataTableGroup'
import { AnchorTextLink } from './TextLink'

type Props = {
  pool: DetailedPool
}

type TableData = {
  order: string
  locked: Decimal | undefined
}

const columns: Column[] = [
  {
    align: 'left',
    header: 'Order',
    cell: (row: TableData) => <Text>{row.order}</Text>,
    flex: '1',
  },
  {
    header: 'Locked',
    cell: (row: TableData) => <LockedRow row={row} />,
    flex: '1',
  },
]

export const EpochList: React.FC<Props> = ({ pool }) => {
  const { data: metadata } = usePoolMetadata(pool)

  const investments: TableData[] = pool.tranches.map((token) => {
    const trancheMeta = metadata?.tranches?.[token.seniority]
    return {
      order: `${trancheMeta?.symbol} investments`,
      locked: token.investFulfillment?.toDecimal(),
    }
  })

  const redmetions: TableData[] = pool.tranches.map((token) => {
    const trancheMeta = metadata?.tranches?.[token.seniority]
    return {
      order: `${trancheMeta?.symbol} redemptions`,
      locked: token.redeemFulfillment?.toDecimal(),
    }
  })

  const summaryInvestments: TableData = {
    order: 'Total investments',
    locked: new Balance(0).toDecimal(),
  }

  const summaryRedemtions: TableData = {
    order: 'Total investments',
    locked: new Balance(0).toDecimal(),
  }

  return (
    <Stack gap="3">
      <DataTableGroup>
        <DataTable data={investments} columns={columns} summary={summaryInvestments} />
        <DataTable data={redmetions} columns={columns} summary={summaryRedemtions} />
      </DataTableGroup>
      <Text variant="body3" color="textSecondary">
        An epoch is a period of locking investments and redemptions.{' '}
        <AnchorTextLink href="https://docs.centrifuge.io/learn/epoch/">Learn more</AnchorTextLink>
      </Text>
    </Stack>
  )
}

const LockedRow: React.VFC<{ row: any }> = ({ row }) => {
  const { pid: poolId } = useParams<{ pid: string }>()
  const pool = usePool(poolId)
  return <Text variant="body2">{row.locked ? formatBalance(row.locked, pool?.currency) : ''}</Text>
}
