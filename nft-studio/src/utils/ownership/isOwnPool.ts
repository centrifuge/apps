import { Pool } from '@centrifuge/centrifuge-js'
import { encodeAddress } from '@polkadot/util-crypto'

export const isOwnPool = (pool: Pool, account: { address: string }): boolean =>
  encodeAddress(pool.owner, 2) === encodeAddress(account.address, 2)
