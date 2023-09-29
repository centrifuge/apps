import Centrifuge from '@centrifuge/centrifuge-js'
import { useCentrifuge, useCentrifugeQuery, useWallet } from '@centrifuge/centrifuge-react'
import { useQuery } from 'react-query'

export function useDomainRouters(suspense?: boolean) {
  const [data] = useCentrifugeQuery(['domainRouters'], (cent) => cent.liquidityPools.getDomainRouters(), { suspense })

  return data
}

export type Domain = (ReturnType<Centrifuge['liquidityPools']['getPool']> extends Promise<infer T> ? T : never) & {
  chainId: number
  managerAddress: string
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
        routers!.map(async (r) => {
          const rpcProvider = getProvider(r.chainId)
          const manager = await cent.liquidityPools.getManagerFromRouter([r.router], {
            rpcProvider,
          })
          const pool = await cent.liquidityPools.getPool([r.chainId, manager, poolId], { rpcProvider })
          return [manager, pool] as const
        })
      )
      console.log('results', results)
      return results
        .map((result, i) => {
          if (result.status === 'rejected') {
            console.error(result.reason)
            return null as never
          }
          const [manager, pool] = result.value
          const router = routers![i]
          if (!pool?.isActive) return null as never
          const domain: Domain = {
            ...pool,
            chainId: router.chainId,
            managerAddress: manager,
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

export function useLPEvents(poolId: string, trancheId: string, lpAddress?: string) {
  const {
    evm: { chainId, getProvider, selectedAddress },
  } = useWallet()
  const cent = useCentrifuge()
  const { data: lps } = useLiquidityPools(poolId, trancheId)
  const lp = lps?.find((l) => l.lpAddress === lpAddress)

  const query = useQuery(
    ['lpDepositedEvents', chainId, lp?.lpAddress, selectedAddress],
    () =>
      cent.liquidityPools.getRecentLPEvents([lp!.lpAddress, selectedAddress!], {
        rpcProvider: getProvider(chainId!),
      }),

    {
      enabled: !!lp && !!selectedAddress,
    }
  )
  return query
}

export function useLiquidityPoolInvestment(poolId: string, trancheId: string, lpIndex?: number) {
  const {
    evm: { chainId, getProvider, selectedAddress },
  } = useWallet()
  const cent = useCentrifuge()
  const { data: domains } = useActiveDomains(poolId)
  const managerAddress = domains?.find((d) => d.chainId === chainId)?.managerAddress

  const { data: lps } = useLiquidityPools(poolId, trancheId)
  const lp = lps?.[lpIndex ?? 0]

  const query = useQuery(
    ['lpInvestment', chainId, lp?.lpAddress, selectedAddress],
    async () => ({
      ...(await cent.liquidityPools.getLiquidityPoolInvestment(
        [selectedAddress!, managerAddress!, lp!.lpAddress, lp!.currencyAddress],
        {
          rpcProvider: getProvider(chainId!),
        }
      )),
      ...lp!,
    }),

    {
      enabled: !!lp && !!selectedAddress,
    }
  )

  return query
}
