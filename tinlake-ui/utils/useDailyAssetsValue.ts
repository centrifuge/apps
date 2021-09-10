import { useQuery } from 'react-query'
import Apollo from '../services/apollo'

export function useDailyAssetsValue(poolId: string) {
  const query = useQuery(['assetsDaily', poolId], () => Apollo.getAssetData(poolId))

  return query
}
