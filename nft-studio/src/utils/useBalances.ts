import { useQuery } from 'react-query'
import { useCentrifuge } from '../components/CentrifugeProvider'

export function useBalances(address?: string) {
  const centrifuge = useCentrifuge()
  const query = useQuery(
    ['balances', address],
    async () => {
      return centrifuge.pools.getBalances([address!])
    },
    {
      enabled: !!address,
    }
  )

  return query
}
