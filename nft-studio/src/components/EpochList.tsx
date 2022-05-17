import { DetailedPool } from '@centrifuge/centrifuge-js'
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

type TableDataRow = {
  order: string | React.ReactElement
  locked: Decimal | React.ReactElement
}

const columns: Column[] = [
  {
    align: 'left',
    header: 'Order',
    cell: (row: TableDataRow) => <Text variant="body2">{row.order}</Text>,
    flex: '1',
  },
  {
    header: 'Locked',
    cell: (row: TableDataRow) => <LockedRow row={row} />,
    flex: '1',
  },
]

export const EpochList: React.FC<Props> = ({ pool }) => {
  const { data: metadata } = usePoolMetadata(pool)

  const investments: TableDataRow[] = pool.tranches.map((token) => {
    const trancheMeta = metadata?.tranches?.[token.seniority]
    return {
      order: `${trancheMeta?.symbol} investments`,
      locked: token.outstandingInvestOrders?.toDecimal() || new Decimal(0),
    }
  })

  const redmetions: TableDataRow[] = pool.tranches.map((token) => {
    const trancheMeta = metadata?.tranches?.[token.seniority]
    return {
      order: `${trancheMeta?.symbol} redemptions`,
      locked: token.outstandingRedeemOrders?.toDecimal() || new Decimal(0),
    }
  })

  const summaryInvestments: TableDataRow = {
    order: (
      <Text variant="body2" fontWeight={600}>
        Total investments
      </Text>
    ),
    locked: (
      <Text variant="body2" fontWeight={600}>
        {formatBalance(
          investments.reduce((prev, curr) => prev.add(curr.locked as Decimal), new Decimal(0)),
          pool.currency
        )}
      </Text>
    ),
  }

  const summaryRedemtions: TableDataRow = {
    order: (
      <Text variant="body2" fontWeight={600}>
        Total redemptions
      </Text>
    ),
    locked: (
      <Text variant="body2" fontWeight={600}>
        {formatBalance(
          redmetions.reduce((prev, curr) => prev.add(curr.locked as Decimal), new Decimal(0)),
          pool.currency
        )}
      </Text>
    ),
  }

  return (
    <Stack gap="2">
      <Stack gap="3">
        <DataTableGroup>
          <DataTable data={investments} columns={columns} summary={summaryInvestments} />
          <DataTable data={redmetions} columns={columns} summary={summaryRedemtions} />
        </DataTableGroup>
      </Stack>
      <Text variant="body3" color="textSecondary">
        An epoch is a period of locking investments and redemptions.{' '}
        <AnchorTextLink href="https://docs.centrifuge.io/learn/epoch/">Learn more</AnchorTextLink>
      </Text>
    </Stack>
  )
}

const LockedRow: React.VFC<{ row: TableDataRow }> = ({ row }) => {
  const { pid: poolId } = useParams<{ pid: string }>()
  const pool = usePool(poolId)
  return (
    <Text variant="body2">
      {React.isValidElement(row.locked) ? row.locked : formatBalance(row.locked, pool?.currency)}
    </Text>
  )
}
