import { useQuery } from 'react-query'
import { initPolkadotApi } from './web3'

export function useIdentity(address?: string) {
  const query = useQuery(
    ['identity', address],
    async () => {
      const api = await initPolkadotApi('kusama')
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
