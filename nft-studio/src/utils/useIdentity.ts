import { useQuery } from 'react-query'
import { useCentrifuge } from '../components/CentrifugeProvider'

export function useIdentity(address?: string) {
  const cent = useCentrifuge()
  const query = useQuery(
    ['identity', address],
    async () => {
      const api = await cent.getRelayChainApi()
      const result = await api.query.identity.identityOf(address)
      const obj = result.toHuman() as any
      if (!obj) return null
      return {
        display: obj.info.display.Raw,
      }
    },
    {
      enabled: !!address,
      staleTime: Infinity,
    }
  )

  return query
}
