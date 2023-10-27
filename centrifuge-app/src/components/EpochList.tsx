import { Perquintill, Pool } from '@centrifuge/centrifuge-js'
import { Stack, Text } from '@centrifuge/fabric'
import Decimal from 'decimal.js-light'
import * as React from 'react'
import { useParams } from 'react-router'
import { formatBalance } from '../utils/formatting'
import { useLiquidity } from '../utils/useLiquidity'
import { usePool } from '../utils/usePools'
import { Column, DataTable } from './DataTable'
import { DataTableGroup } from './DataTableGroup'
import { AnchorTextLink } from './TextLink'

type Props = {
  pool: Pool
}

export type LiquidityTableRow = {
  order: string | React.ReactElement
  locked: Decimal | React.ReactElement
  executing?: Decimal | React.ReactElement
  executingPercentage?: Perquintill | React.ReactElement
}

export const columns: Column[] = [
  {
    align: 'left',
    header: 'Order',
    cell: (row: LiquidityTableRow) => row.order,
  },
  {
    header: 'Locked',
    cell: (row: LiquidityTableRow) => <LockedRow row={row} />,
  },
  // {
  //   header: 'Executing',
  //   cell: (row: LiquidityTableRow) => <ExecutingRow row={row} />,
  //   flex: '3',
  // },
  // {
  //   header: '%',
  //   cell: (row: LiquidityTableRow) => <ExecutingPercentageRow row={row} />,
  //   flex: '1',
  // },
]

export const EpochList: React.FC<Props> = ({ pool }) => {
  // const theme = useTheme()
  const {
    // sumOfExecutableInvestments,
    sumOfLockedInvestments,
    // sumOfExecutableRedemptions,
    sumOfLockedRedemptions,
    investments,
    redemptions,
  } = useLiquidity(pool.id)
  const summaryInvestments: LiquidityTableRow = {
    order: (
      <Text variant="body2" fontWeight={600}>
        Total investments
      </Text>
    ),
    locked: (
      <Text variant="body2" fontWeight={600}>
        {formatBalance(sumOfLockedInvestments, pool.currency.symbol)}
      </Text>
    ),
    // executing: (
    //   <Text
    //     variant="body2"
    //     fontWeight={600}
    //     color={
    //       !sumOfLockedInvestments.equals(sumOfExecutableInvestments)
    //         ? theme.colors.statusWarning
    //         : theme.colors.textPrimary
    //     }
    //   >
    //     {formatBalance(sumOfExecutableInvestments, pool.currency.symbol)}
    //   </Text>
    // ),
    // executingPercentage: (
    //   <Text
    //     variant="body2"
    //     fontWeight={600}
    //     color={
    //       !sumOfLockedInvestments.equals(sumOfExecutableInvestments)
    //         ? theme.colors.statusWarning
    //         : theme.colors.textPrimary
    //     }
    //   >
    //     {formatPercentage(
    //       Perquintill.fromFloat(
    //         sumOfExecutableInvestments.div(sumOfLockedInvestments.gt(0) ? sumOfLockedInvestments : 1)
    //       )
    //     )}
    //   </Text>
    // ),
  }

  const summaryRedemptions: LiquidityTableRow = {
    order: (
      <Text variant="body2" fontWeight={600}>
        Total redemptions
      </Text>
    ),
    locked: (
      <Text variant="body2" fontWeight={600}>
        {formatBalance(sumOfLockedRedemptions, pool.currency.symbol)}
      </Text>
    ),
    // executing: (
    //   <Text
    //     variant="body2"
    //     fontWeight={600}
    //     color={
    //       !sumOfLockedRedemptions.equals(sumOfExecutableRedemptions)
    //         ? theme.colors.statusWarning
    //         : theme.colors.textPrimary
    //     }
    //   >
    //     {formatBalance(sumOfExecutableRedemptions, pool.currency.symbol)}
    //   </Text>
    // ),
    // executingPercentage: (
    //   <Text
    //     variant="body2"
    //     fontWeight={600}
    //     color={
    //       !sumOfLockedRedemptions.equals(sumOfExecutableRedemptions)
    //         ? theme.colors.statusWarning
    //         : theme.colors.textPrimary
    //     }
    //   >
    //     {formatPercentage(
    //       Perquintill.fromFloat(
    //         sumOfExecutableRedemptions.div(sumOfLockedRedemptions.gt(0) ? sumOfLockedRedemptions : 1)
    //       )
    //     )}
    //   </Text>
    // ),
  }

  return (
    <Stack gap="2">
      <Stack gap="3">
        <DataTableGroup>
          <DataTable data={investments} columns={columns} summary={summaryInvestments} />
          <DataTable data={redemptions} columns={columns} summary={summaryRedemptions} />
        </DataTableGroup>
      </Stack>
      <Text as="small" variant="body3" color="textSecondary">
        <AnchorTextLink href="https://docs.centrifuge.io/learn/epoch/">Learn more</AnchorTextLink> about how orders are
        processed.
      </Text>
    </Stack>
  )
}

const LockedRow: React.VFC<{ row: LiquidityTableRow }> = ({ row }) => {
  const { pid: poolId } = useParams<{ pid: string }>()
  const pool = usePool(poolId)
  return (
    <>{React.isValidElement(row.locked) ? row.locked : formatBalance(row.locked as Decimal, pool.currency.symbol)}</>
  )
}

// const ExecutingRow: React.VFC<{ row: LiquidityTableRow }> = ({ row }) => {
//   const { pid: poolId } = useParams<{ pid: string }>()
//   const pool = usePool(poolId)
//   return (
//     <>{React.isValidElement(row.executing) ? row.executing : formatBalance(row.executing || 0, pool.currency.symbol)}</>
//   )
// }

// const ExecutingPercentageRow: React.VFC<{ row: LiquidityTableRow }> = ({ row }) => {
//   return (
//     <>
//       {React.isValidElement(row.executingPercentage)
//         ? row.executingPercentage
//         : formatPercentage((row?.executingPercentage as Perquintill) || 0)}
//     </>
//   )
// }
