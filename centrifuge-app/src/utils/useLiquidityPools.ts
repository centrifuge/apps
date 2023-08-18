import { useCentrifuge, useCentrifugeQuery, useWallet } from '@centrifuge/centrifuge-react'
import { useQuery } from 'react-query'

export function useDomainRouters() {
  const [data] = useCentrifugeQuery(['domainRouters'], (cent) => cent.liquidityPools.getDomainRouters())

  return data
}

export function useActiveDomains(poolId: string) {
  const {
    evm: { getProvider },
  } = useWallet()
  const cent = useCentrifuge()
  const routers = useDomainRouters()
  const query = useQuery(
    ['activeDomains', poolId, routers?.length],
    async () => {
      // const results = await Promise.allSettled(
      //   routers!.map(async (r) => {
      //     const manager = await cent.liquidityPools.getManagerFromRouter([r.router], {
      //       rpcProvider: getProvider(r.chainId),
      //     })
      //     const pool = await cent.liquidityPools.getPool([manager, poolId], { rpcProvider: getProvider(r.chainId) })
      //     return [manager, pool] as const
      //   })
      // )
      // console.log('res', results)
      // return results!
      //   .map((result, i) => {
      //     if (result.status === 'rejected') return null
      //     const [manager, pool] = result.value
      //     const router = routers![i]
      //     if (!pool.isActive) return null
      //     return {
      //       chainId: router.chainId,
      //       managerAddress: manager,
      //     }
      //   })
      //   .filter(Boolean) as {
      //   chainId: number
      //   managerAddress: string
      // }[]
      return [
        {
          chainId: 5,
          managerAddress: '0x253836e3520b2aa66328d17b65411591d4227df6',
        },
      ]
    },
    {
      enabled: !!routers?.length && !poolId.startsWith('0x'),
      staleTime: Infinity,
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
      cent.liquidityPools.getLiquidityPools([managerAddress!, poolId, trancheId], {
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
      ...(await cent.liquidityPools.getLiquidityPoolInvestment([selectedAddress!, managerAddress!, lp!.lpAddress], {
        rpcProvider: getProvider(chainId!),
      })),
      ...lp!,
    }),

    {
      enabled: !!lp && !!selectedAddress,
    }
  )

  console.log('lpInvest', query.data)

  return query
}
