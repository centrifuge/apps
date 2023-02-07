import { useQuery } from 'react-query'
import { useWallet } from '../components/WalletProvider'
import { useProvider } from '../components/WalletProvider/evm/utils'

export function useEnsName(address?: string) {
  const { evm, connectedType } = useWallet()
  const { selectedWallet, chainId, selectedAccount } = evm
  const provider = useProvider(selectedWallet?.connector, chainId)
  const addr = address ?? selectedAccount
  const { data } = useQuery(['ensName', addr, !!provider, chainId], () => provider!.lookupAddress(addr!), {
    enabled: !!provider && !!addr,
  })
  return connectedType === 'evm' || address ? data : undefined
}
