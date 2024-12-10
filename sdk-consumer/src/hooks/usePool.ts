import { Pool } from '@centrifuge/sdk'
import { useMemo, useState } from 'react'
import { switchMap } from 'rxjs'
import { centrifuge } from '../centrifuge'
import { useCentrifugeQuery } from './useCentrifugeQuery'

const poolId = '2779829532'
const trancheId = '0xac6bffc5fd68f7772ceddec7b0a316ca'

function usePools() {
  const [pools] = useState(() => [new Pool(centrifuge, poolId)])
  return pools
}

export function useVaults(poolId: string, trancheId: string, chainId: number) {
  const pool = usePools().find((p) => p.id === poolId)
  const vaults$ = useMemo(
    () => pool?.network(chainId).pipe(switchMap((network) => network.vaults(trancheId))),
    [pool, trancheId]
  )
  return useCentrifugeQuery(vaults$)
}
