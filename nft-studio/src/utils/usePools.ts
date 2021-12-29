import { useQuery } from 'react-query'
import { useCentrifuge } from '../components/CentrifugeProvider'

export function usePools() {
  const centrifuge = useCentrifuge()
  const query = useQuery(
    ['pools'],
    async () => {
      return centrifuge.pools.getPools()
    },
    {
      suspense: true,
    }
  )

  return query
}

export function usePool(id: string) {
  const centrifuge = useCentrifuge()
  const query = useQuery(
    ['pool', id],
    async () => {
      return centrifuge.pools.getPool([id])
    },
    {
      suspense: true,
    }
  )

  return query
}
