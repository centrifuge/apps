import { Perquintill, Pool, TrancheResult } from '@centrifuge/centrifuge-js'
import { Stack, Text } from '@centrifuge/fabric'
import Decimal from 'decimal.js-light'
import * as React from 'react'
import { useParams } from 'react-router'
import { useTheme } from 'styled-components'
import { formatBalance, formatPercentage } from '../utils/formatting'
import { useCentrifugeTransaction } from '../utils/useCentrifugeTransaction'
import { usePool, usePoolMetadata } from '../utils/usePools'
import { Column, DataTable } from './DataTable'
import { DataTableGroup } from './DataTableGroup'
import { AnchorTextLink } from './TextLink'

type Props = {
  pool: Pool
}

type TableDataRow = {
  order: string | React.ReactElement
  locked: Decimal | React.ReactElement
  executing?: Decimal | React.ReactElement
  executingPercentage?: Perquintill | React.ReactElement
}

const columns: Column[] = [
  {
    align: 'left',
    header: 'Order',
    cell: (row: TableDataRow) => <Text variant="body2">{row.order}</Text>,
    flex: '3',
  },
  {
    header: 'Locked',
    cell: (row: TableDataRow) => <LockedRow row={row} />,
    flex: '3',
  },
  {
    header: 'Executing',
    cell: (row: TableDataRow) => <ExecutingRow row={row} />,
    flex: '3',
  },
  {
    header: '%',
    cell: (row: TableDataRow) => <ExecutingPercentageRow row={row} />,
    flex: '1',
  },
]

export const EpochList: React.FC<Props> = ({ pool }) => {
  const { data: metadata } = usePoolMetadata(pool)
  const [executableOrders, setExecutableOrders] = React.useState<TrancheResult[]>()
  const theme = useTheme()

  const { execute: submitSolutionTx } = useCentrifugeTransaction(
    'Submit solution',
    (cent) => cent.pools.submitSolution,
    {
      onSuccess: (_, result) => {
        // @ts-ignore
        setExecutableOrders(result.tranches)
        console.log('Solution successfully submitted')
      },
      onError: (error) => {
        console.log('Solution unsuccesful', error?.toJSON())
      },
    }
  )

  const submitSolution = async () => {
    if (!pool) return
    submitSolutionTx([pool.id, true])
  }

  React.useEffect(() => {
    submitSolution()
  }, [])

  const investments: TableDataRow[] = React.useMemo(() => {
    return pool.tranches.map((token, index) => {
      const trancheMeta = metadata?.tranches?.[token.id]
      return {
        order: `${trancheMeta?.symbol} investments`,
        locked: token.outstandingInvestOrders?.toDecimal() || new Decimal(0),
        executing: executableOrders?.[index]?.invest.amount.toDecimal() || new Decimal(0),
        executingPercentage: executableOrders?.[index]?.invest.perquintill || Perquintill.fromPercent(0),
      }
    })
  }, [metadata, executableOrders])

  const redemptions: TableDataRow[] = React.useMemo(() => {
    return pool.tranches.map((token, index) => {
      const trancheMeta = metadata?.tranches?.[token.id]
      return {
        order: `${trancheMeta?.symbol} redemptions`,
        locked: token.outstandingRedeemOrders?.toDecimal() || new Decimal(0),
        executing: executableOrders?.[index]?.redeem.amount.toDecimal() || new Decimal(0),
        executingPercentage: executableOrders?.[index]?.redeem.perquintill || Perquintill.fromPercent(0),
      }
    })
  }, [metadata, executableOrders])

  const summaryInvestments: TableDataRow = React.useMemo(() => {
    const sumOfLockedInvestments = investments.reduce((prev, { locked }) => prev.add(locked as Decimal), new Decimal(0))
    const sumOfExecutableInvestments = investments.reduce(
      (prev, { executing }) => prev.add(executing as Decimal),
      new Decimal(0)
    )
    return {
      order: (
        <Text variant="body2" fontWeight={600}>
          Total investments
        </Text>
      ),
      locked: (
        <Text variant="body2" fontWeight={600}>
          {formatBalance(sumOfLockedInvestments, pool.currency)}
        </Text>
      ),
      executing: (
        <Text
          variant="body2"
          fontWeight={600}
          color={
            !sumOfLockedInvestments.equals(sumOfExecutableInvestments)
              ? theme.colors.statusWarning
              : theme.colors.textPrimary
          }
        >
          {formatBalance(sumOfExecutableInvestments, pool.currency)}
        </Text>
      ),
      executingPercentage: (
        <Text
          variant="body2"
          fontWeight={600}
          color={
            !sumOfLockedInvestments.equals(sumOfExecutableInvestments)
              ? theme.colors.statusWarning
              : theme.colors.textPrimary
          }
        >
          {formatPercentage(Perquintill.fromFloat(sumOfExecutableInvestments.div(sumOfLockedInvestments)))}
        </Text>
      ),
    }
  }, [investments])

  const summaryRedemtions: TableDataRow = React.useMemo(() => {
    const sumOfLockedRedemptions = redemptions.reduce((prev, { locked }) => prev.add(locked as Decimal), new Decimal(0))
    const sumOfExecutableRedemptions = redemptions.reduce(
      (prev, { executing }) => prev.add(executing as Decimal),
      new Decimal(0)
    )
    return {
      order: (
        <Text variant="body2" fontWeight={600}>
          Total redemptions
        </Text>
      ),
      locked: (
        <Text variant="body2" fontWeight={600}>
          {formatBalance(
            redemptions.reduce((prev, curr) => prev.add(curr.locked as Decimal), new Decimal(0)),
            pool.currency
          )}
        </Text>
      ),
      executing: (
        <Text
          variant="body2"
          fontWeight={600}
          color={
            !sumOfLockedRedemptions.equals(sumOfExecutableRedemptions)
              ? theme.colors.statusWarning
              : theme.colors.textPrimary
          }
        >
          {formatBalance(
            redemptions.reduce((prev, curr) => prev.add(curr.executing as any), new Decimal(0)),
            pool.currency
          )}
        </Text>
      ),
      executingPercentage: (
        <Text
          variant="body2"
          fontWeight={600}
          color={
            !sumOfLockedRedemptions.equals(sumOfExecutableRedemptions)
              ? theme.colors.statusWarning
              : theme.colors.textPrimary
          }
        >
          {formatPercentage(Perquintill.fromFloat(sumOfExecutableRedemptions.div(sumOfLockedRedemptions)))}
        </Text>
      ),
    }
  }, [redemptions])

  return (
    <Stack gap="2">
      <Stack gap="3">
        <DataTableGroup>
          <DataTable data={investments} columns={columns} summary={summaryInvestments} />
          <DataTable data={redemptions} columns={columns} summary={summaryRedemtions} />
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

const ExecutingRow: React.VFC<{ row: TableDataRow }> = ({ row }) => {
  const { pid: poolId } = useParams<{ pid: string }>()
  const pool = usePool(poolId)
  return (
    <Text variant="body2">
      {React.isValidElement(row.executing) ? row.executing : formatBalance(row.executing || 0, pool?.currency)}
    </Text>
  )
}

const ExecutingPercentageRow: React.VFC<{ row: TableDataRow }> = ({ row }) => {
  return (
    <Text variant="body2">
      {React.isValidElement(row.executingPercentage)
        ? row.executingPercentage
        : formatPercentage((row?.executingPercentage as Perquintill) || 0)}
    </Text>
  )
}
