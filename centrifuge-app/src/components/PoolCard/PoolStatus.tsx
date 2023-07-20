import { Pool } from '@centrifuge/centrifuge-js'
import { StatusChip } from '@centrifuge/fabric'
import * as React from 'react'
import { TinlakePool } from '../../utils/tinlake/useTinlakePools'

export function PoolStatus({ pool }: { pool?: Pool | TinlakePool }) {
  if (!pool) {
    return <>—</>
  }

  const tinlakePool = pool.id?.startsWith('0x') && (pool as TinlakePool)

  return tinlakePool && tinlakePool.addresses.CLERK !== undefined && tinlakePool.tinlakeMetadata.maker?.ilk ? (
    <StatusChip status="ok">Maker Pool</StatusChip>
  ) : pool.tranches.at(-1)?.capacity.toFloat() ? (
    <StatusChip status="info">Open for investments</StatusChip>
  ) : (
    <StatusChip status="default">Closed</StatusChip>
  )
}
