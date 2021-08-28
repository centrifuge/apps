import { useQuery } from 'react-query'
import Apollo from '../services/apollo'

export function useDailyTVL() {
  return useQuery('dailyTVL', () => Apollo.getPoolsDailyData(), { staleTime: 24 * 60 * 60 * 1000 })
}
