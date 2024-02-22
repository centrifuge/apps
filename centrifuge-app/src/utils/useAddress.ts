import { useAddress as useWalletAddress } from '@centrifuge/centrifuge-react'
import { useDebugFlags } from '../components/DebugFlags'

export function useAddress(typeOverride?: 'substrate' | 'evm') {
  const { address: debugSubstrateAddress, evmAddress: debugEvmAddress } = useDebugFlags()
  const address = useWalletAddress(typeOverride)
  const debugAddress = typeOverride === 'evm' ? debugEvmAddress : debugSubstrateAddress

  return (debugAddress as string) || address
}
