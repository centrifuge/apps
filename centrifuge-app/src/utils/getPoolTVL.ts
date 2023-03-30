import { Pool } from '@centrifuge/centrifuge-js'
import type { TinlakePool } from './tinlake/useTinlakePools'

export function getPoolTVL(pool: TinlakePool | Pool) {
  return pool.nav.latest.toFloat() + pool.reserve.total.toFloat()
}
