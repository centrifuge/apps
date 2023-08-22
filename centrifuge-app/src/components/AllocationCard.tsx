import { AccountTokenBalance } from '@centrifuge/centrifuge-js'
import { Box, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { usePool, usePoolMetadata } from '../utils/usePools'

type AlloationCardProps = AccountTokenBalance

export function AllocationCard({ balance, currency, poolId, trancheId }: AlloationCardProps) {
  const pool = usePool(poolId)
  const { data: poolMetadata } = usePoolMetadata(pool)

  return (
    <Box>
      <Text>{poolMetadata?.pool?.asset.class}</Text>{' '}
    </Box>
  )
}
