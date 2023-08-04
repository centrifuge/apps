import { useAddress as useWalletAddress, useWallet } from '@centrifuge/centrifuge-react'
import { useDebugFlags } from '../components/DebugFlags'

export function useAddress(typeOverride?: 'substrate' | 'evm') {
  const { address: debugSubstrateAddress, evmAddress: debugEvmAddress } = useDebugFlags()
  const { connectedType } = useWallet()
  const address = useWalletAddress(typeOverride)
  const { isEvmOnSubstrate } = useWallet()
  const debugAddress =
    typeOverride === 'evm' || (connectedType === 'evm' && !isEvmOnSubstrate) ? debugEvmAddress : debugSubstrateAddress

  return (debugAddress as string) || address
}
