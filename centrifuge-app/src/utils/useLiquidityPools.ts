import Centrifuge from '@centrifuge/centrifuge-js'
import { useCentrifuge, useCentrifugeQuery, useWallet } from '@centrifuge/centrifuge-react'
import { useQuery } from 'react-query'
import { useAddress } from './useAddress'

export function useDomainRouters(suspense?: boolean) {
  const [data] = useCentrifugeQuery(['domainRouters'], (cent) => cent.liquidityPools.getDomainRouters(), { suspense })

  return data
}

export type Domain = (ReturnType<Centrifuge['liquidityPools']['getPool']> extends Promise<infer T> ? T : never) & {
  chainId: number
  managerAddress: string
  hasDeployedLp: boolean
}

export function useActiveDomains(poolId: string, suspense?: boolean) {
  const {
    evm: { getProvider },
  } = useWallet()
  const cent = useCentrifuge()
  const routers = useDomainRouters(suspense)
  const query = useQuery(
    ['activeDomains', poolId, routers?.length],
    async () => {
      const results = await Promise.allSettled(
        routers!.map((r) => {
          async function getManager() {
            const rpcProvider = getProvider(r.chainId)
            const manager = await cent.liquidityPools.getManagerFromRouter([r.router], {
              rpcProvider,
            })
            const pool = await cent.liquidityPools.getPool([r.chainId, manager, poolId], { rpcProvider })
            return [manager, pool] as const
          }
          return withTimeout(getManager(), 15000)
        })
      )
      return results
        .map((result, i) => {
          if (result.status === 'rejected') {
            console.error(result.reason)
            return null as never
          }
          const [manager, pool] = result.value
          const router = routers![i]
          const domain: Domain = {
            ...pool,
            chainId: router.chainId,
            managerAddress: manager,
            hasDeployedLp:
              pool.liquidityPools &&
              Object.values(pool.liquidityPools).some((tranche) => !!Object.values(tranche).some((p) => !!p)),
          }
          return domain
        })
        .filter(Boolean)
    },
    {
      enabled: !!routers?.length && !poolId.startsWith('0x'),
      staleTime: Infinity,
      suspense,
    }
  )

  return query
}

export function useLiquidityPools(poolId: string, trancheId: string) {
  const {
    evm: { chainId, getProvider },
  } = useWallet()
  const cent = useCentrifuge()
  const { data: domains } = useActiveDomains(poolId)
  const managerAddress = domains?.find((d) => d.chainId === chainId)?.managerAddress

  const query = useQuery(
    ['lps', poolId, trancheId, chainId],
    () =>
      cent.liquidityPools.getLiquidityPools([managerAddress!, poolId, trancheId, chainId!], {
        rpcProvider: getProvider(chainId!),
      }),
    {
      enabled: !!managerAddress,
      staleTime: Infinity,
    }
  )

  return query
}

export function useLiquidityPoolInvestment(poolId: string, trancheId: string, lpIndex?: number) {
  const {
    evm: { chainId, getProvider },
  } = useWallet()
  const address = useAddress('evm')
  const cent = useCentrifuge()

  const { data: lps } = useLiquidityPools(poolId, trancheId)
  const lp = lps?.[lpIndex ?? 0]

  const query = useQuery(
    ['lpInvestment', chainId, lp?.lpAddress, address],
    async () => ({
      ...(await cent.liquidityPools.getLiquidityPoolInvestment([address!, lp!], {
        rpcProvider: getProvider(chainId!),
      })),
      ...lp!,
    }),
    {
      enabled: !!lp && !!address,
    }
  )

  return query
}

function timeout(ms: number): Promise<never> {
  return new Promise((_, reject) => setTimeout(() => reject(new Error('Operation timed out')), ms))
}
function withTimeout<T>(promise: Promise<T>, ms: number) {
  return Promise.race([promise, timeout(ms)])
}
