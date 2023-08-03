import { useQuery } from 'react-query'
import { useWallet } from '../components/WalletProvider'
import { useProviderForConnector } from '../components/WalletProvider/evm/utils'

export function useEns(address?: string) {
  const { evm, connectedType } = useWallet()
  const { selectedWallet, chainId, selectedAddress } = evm
  const provider = useProviderForConnector(selectedWallet?.connector, chainId)
  const addr = address || (connectedType === 'evm' ? selectedAddress : undefined)
  const { data: name } = useQuery(
    ['ensName', addr, !!provider, chainId],
    async () => {
      try {
        return await provider!.lookupAddress(addr!)
      } catch {
        return null
      }
    },
    {
      enabled: !!provider && !!addr,
      staleTime: Infinity,
    }
  )
  const { data: avatar } = useQuery(
    ['ensAvatar', addr, !!provider, chainId],
    async () => {
      try {
        return await provider!.getAvatar(addr!)
      } catch {
        return null
      }
    },
    {
      enabled: !!provider && !!addr,
      staleTime: Infinity,
    }
  )
  return connectedType === 'evm' || address ? { name, avatar } : {}
}
