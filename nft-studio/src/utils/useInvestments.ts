import { useQuery } from 'react-query'
import { useCentrifuge } from '../components/CentrifugeProvider'

export function useInvestmentTokens(address?: string) {
  const centrifuge = useCentrifuge()
  const query = useQuery(
    ['investmentTokens'],
    async () => {
      return centrifuge.pools.getInvestments([address!])
    },
    {
      suspense: true,
      enabled: !!address,
    }
  )

  return query
}
