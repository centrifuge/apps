import { useQuery } from 'react-query'
import Apollo from '../services/apollo'

export function useGlobalRewards() {
  const query = useQuery('globalRewards', () => Apollo.getRewards(), {
    staleTime: 60 * 60 * 1000,
  })

  return query
}
