import { useQuery } from 'react-query'
import Apollo from '../services/apollo'

export function useDailyPoolData(poolId: string) {
  const query = useQuery(['dailyPoolData', poolId], () => Apollo.getDailyPoolData(poolId))

  return query
}
