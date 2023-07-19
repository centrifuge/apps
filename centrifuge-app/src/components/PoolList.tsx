import { Pool } from '@centrifuge/centrifuge-js'
import { Box, Stack } from '@centrifuge/fabric'
import * as React from 'react'
import { TinlakePool } from '../utils/tinlake/useTinlakePools'
import { PoolCard } from './PoolCard'

type Props = {
  pools: (Pool | TinlakePool)[]
  isLoading?: boolean
}

export const PoolList: React.FC<Props> = ({ pools, isLoading }) => {
  return (
    <Box overflow="auto">
      <Stack as="ul" role="list" p={[2, 3]} gap={1} minWidth={1030}>
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
