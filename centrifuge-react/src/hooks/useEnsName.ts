import { useQuery } from 'react-query'
import { useEvmWallet } from '../components/WalletProvider'
import { useProvider } from '../utils/evm'

export function useEnsName(address?: string) {
  const { selectedConnector, chainId, selectedAccount } = useEvmWallet()
  const provider = useProvider(selectedConnector, chainId)
  const addr = address ?? selectedAccount
  const { data } = useQuery(['ensName', addr, !!provider, chainId], () => provider!.lookupAddress(addr!), {
    enabled: !!provider && !!addr,
  })
  return data
}
