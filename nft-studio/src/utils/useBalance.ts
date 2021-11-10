import { BN } from '@polkadot/util'
import { useQuery } from 'react-query'
import { useWeb3 } from '../components/Web3Provider'
import { initPolkadotApi } from './web3'

export function useBalance() {
  const { selectedAccount } = useWeb3()
  const query = useQuery(
    ['balance', selectedAccount?.address],
    async () => {
      const api = await initPolkadotApi()
      const balances = await api.query.system.account(selectedAccount!.address)
      return balances.data.free.div(new BN(10).pow(new BN(18))).toString()
    },
    {
      enabled: !!selectedAccount,
    }
  )

  return query
}
