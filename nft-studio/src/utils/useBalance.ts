import { useQuery } from 'react-query'
import { useCentrifuge } from '../components/CentrifugeProvider'
import { useAddress } from './useAddress'

export function useBalance() {
  const cent = useCentrifuge()
  const address = useAddress()
  const query = useQuery(
    ['balance', address],
    async () => {
      const api = await cent.getApi()
      const balances = await api.query.system.account(address!)
      return Number(balances.data.free.toString()) / 10 ** (api.registry.chainDecimals as any)
    },
    {
      enabled: !!address,
      staleTime: 60 * 1000,
    }
  )

  return query
}
