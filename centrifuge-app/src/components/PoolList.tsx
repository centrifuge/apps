import { Pool } from '@centrifuge/centrifuge-js'
import { Box, Stack } from '@centrifuge/fabric'
import * as React from 'react'
import { TinlakePool } from '../utils/tinlake/useTinlakePools'
import { PoolCard } from './PoolCard'

type PoolListProps = {
  pools: (Pool | TinlakePool)[]
  isLoading?: boolean
}

export function PoolList({ pools, isLoading }: PoolListProps) {
  return (
    <Box overflow="auto">
      <Stack as="ul" role="list" gap={1} minWidth={900}>
        {pools.map((pool) => {
          return (
            <Box as="li" key={pool.id}>
              <PoolCard pool={pool} />
            </Box>
          )
        })}
        {isLoading && (
          <Box as="li">
            <PoolCard />
          </Box>
        )}
      </Stack>
    </Box>
  )
}
