import { useQuery } from 'react-query'
import { useCentrifuge } from '../components/CentrifugeProvider'
import { useWeb3 } from '../components/Web3Provider'

export function useBalance() {
  const cent = useCentrifuge()
  const { selectedAccount } = useWeb3()
  const query = useQuery(
    ['balance', selectedAccount?.address],
    async () => {
      const api = await cent.getApi()
      const balances = await api.query.system.account(selectedAccount!.address)
      return Number(balances.data.free.toString()) / 10 ** (api.registry.chainDecimals as any)
    },
    {
      enabled: !!selectedAccount,
      staleTime: 60 * 1000,
    }
  )

  return query
}
