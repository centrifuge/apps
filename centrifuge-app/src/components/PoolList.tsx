import { Pool } from '@centrifuge/centrifuge-js'
import { Grid } from '@centrifuge/fabric'
import * as React from 'react'
import { PoolCard } from './PoolCard'

type Props = {
  pools: Pool[]
}

export const PoolList: React.FC<Props> = ({ pools }) => {
  return (
    <Grid columns={[1, 2]} gap={[3, 2]} m={[2, 3]} equalColumns>
      {pools.map((pool) => {
        return <PoolCard key={pool.id} pool={pool} />
      })}
    </Grid>
  )
}
