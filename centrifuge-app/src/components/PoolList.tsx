import { Box, Stack } from '@centrifuge/fabric'
import * as React from 'react'
import { PoolCard, PoolCardProps } from './PoolCard'

type PoolListProps = {
  pools: PoolCardProps[]
  isLoading?: boolean
}

export function PoolList({ pools, isLoading }: PoolListProps) {
  return (
    <Box overflow="auto">
      <Stack as="ul" role="list" gap={1} minWidth={900}>
        {isLoading
          ? Array(6)
              .fill(true)
              .map((_, index) => (
                <Box as="li" key={index}>
                  <PoolCard isLoading={true} />
                </Box>
              ))
          : pools.map((pool) => (
              <Box as="li" key={pool.poolId}>
                <PoolCard {...pool} />
              </Box>
            ))}
      </Stack>
    </Box>
  )
}
