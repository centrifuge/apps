import { Pool } from '@centrifuge/centrifuge-js'
import { Grid } from '@centrifuge/fabric'
import * as React from 'react'
import { PodConfig } from '../pages/IssuerPool/Configuration/PodConfig'
import { TinlakePool } from '../utils/tinlake/useTinlakePools'
import { PoolCard } from './PoolCard'

type Props = {
  pools: (Pool | TinlakePool)[]
  isLoading?: boolean
}

export const PoolList: React.FC<Props> = ({ pools, isLoading }) => {
  return (
    <>
      <PodConfig />
      <Grid columns={[1, 2]} gap={[3, 2]} m={[2, 3]} equalColumns>
        {pools.map((pool) => {
          return <PoolCard key={pool.id} pool={pool} />
        })}
        {isLoading && <PoolCard />}
      </Grid>
    </>
  )
}
