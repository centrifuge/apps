import { Pool } from '@centrifuge/centrifuge-js'
import { Dec } from './Decimal'
import { TinlakePool } from './tinlake/useTinlakePools'

export function getPoolValueLocked(pool: Pool | TinlakePool) {
  return pool.tranches
    .map((tranche) =>
      tranche.tokenPrice ? tranche.totalIssuance.toDecimal().mul(tranche.tokenPrice.toDecimal()) : Dec(0)
    )
    .reduce((a, b) => a.add(b))
}
