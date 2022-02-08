import { useQuery } from 'react-query'
import { useCentrifuge } from '../components/CentrifugeProvider'

export function usePermissions(address?: string) {
  const centrifuge = useCentrifuge()
  const query = useQuery(
    ['permissions', address],
    async () => {
      return centrifuge.pools.getRolesByPool([address!])
    },
    {
      enabled: !!address,
    }
  )

  return query
}
