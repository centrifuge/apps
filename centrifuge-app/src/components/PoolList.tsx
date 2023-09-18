import { Box, Stack } from '@centrifuge/fabric'
import * as React from 'react'
import styled from 'styled-components'
import { PoolCard, PoolCardProps } from './PoolCard'
import { PoolStatusKey } from './PoolCard/PoolStatus'

type PoolListProps = {
  pools: PoolCardProps[]
  isLoading?: boolean
}

const PoolCardBox = styled<typeof Box & { status?: PoolStatusKey }>(Box)`
  &:hover {
    cursor: ${(props) => (props.status === 'Upcoming' ? 'not-allowed' : 'default')};
  }
`

export function PoolList({ pools, isLoading }: PoolListProps) {
  return (
    <Stack as="ul" role="list" gap={1} minWidth={970} py={1}>
      {isLoading
        ? Array(6)
            .fill(true)
            .map((_, index) => (
              <Box as="li" key={index}>
                <PoolCard isLoading={true} />
              </Box>
            ))
        : pools.map((pool) => (
            <PoolCardBox as="li" key={pool.poolId} status={pool.status}>
              <PoolCard {...pool} />
            </PoolCardBox>
          ))}
    </Stack>
  )
}
