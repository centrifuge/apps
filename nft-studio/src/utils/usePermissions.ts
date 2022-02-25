import { useCentrifugeQuery } from './useCentrifugeQuery'

export function usePermissions(address?: string) {
  const [result] = useCentrifugeQuery(['permissions', address], (cent) => cent.pools.getRolesByPool([address!]), {
    enabled: !!address,
  })

  return result
}
