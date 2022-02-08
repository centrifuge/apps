import { useQuery } from 'react-query'
import { useCentrifuge } from '../components/CentrifugeProvider'

export function useLoans(poolId: string) {
  const centrifuge = useCentrifuge()
  const query = useQuery(
    ['loans', poolId],
    async () => {
      return centrifuge.pools.getLoans([poolId])
    },
    {
      suspense: true,
    }
  )

  return query
}

export function useLoansAcrossPools(poolIds?: string[]) {
  const centrifuge = useCentrifuge()
  const query = useQuery(
    ['loansAcrossPools', poolIds],
    async () => {
      return (await Promise.all(poolIds!.map((poolId) => centrifuge.pools.getLoans([poolId])))).flat()
    },
    {
      suspense: true,
      enabled: poolIds && poolIds.length > 0,
    }
  )

  return query
}

export function useLoan(poolId: string, assetId: string) {
  const centrifuge = useCentrifuge()
  const query = useQuery(
    ['loan', poolId, assetId],
    async () => {
      return centrifuge.pools.getLoan([poolId, assetId])
    },
    {
      suspense: true,
    }
  )

  return query
}
