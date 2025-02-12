import { Pool, Vault } from '@centrifuge/sdk'
import { useMemo, useState } from 'react'
import { switchMap } from 'rxjs'
import { centrifuge } from '../centrifuge'
import { useCentrifugeQuery } from './useCentrifugeQuery'

const poolIds = ['2779829532', '2853787339', '2118311035', '3783664923', '4139607887']

export function usePools() {
  const [pools] = useState(() => poolIds.map((pid) => new Pool(centrifuge, pid)))
  return pools
}

export function usePool(poolId: string) {
  const pools = usePools()
  const pool = pools.find((p) => p.id === poolId)
  if (!pool) {
    throw new Error(`Pool with id ${poolId} not found`)
  }
  return pool
}

export function useActiveNetworks(poolId: string) {
  const pool = usePools().find((p) => p.id === poolId)
  const networks$ = useMemo(() => {
    return pool?.activeNetworks()
  }, [pool])
  return useCentrifugeQuery(networks$)
}

export function useVaults(poolId: string, trancheId: string, chainId: number) {
  const pool = usePools().find((p) => p.id === poolId)
  const vaults$ = useMemo(
    () => pool?.network(chainId).pipe(switchMap((network) => network.vaults(trancheId))),
    [pool, trancheId]
  )
  return useCentrifugeQuery(vaults$)
}

export function useVaultInvestment(vault?: Vault, investor?: string) {
  const investment$ = useMemo(() => (investor && vault ? vault.investment(investor) : undefined), [vault, investor])
  return useCentrifugeQuery(investment$)
}
