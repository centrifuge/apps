import { useAddress as useWalletAddress } from '@centrifuge/centrifuge-react'
import { useDebugFlags } from '../components/DebugFlags'

export function useAddress(typeOverride?: 'substrate' | 'evm') {
  const address = useWalletAddress(typeOverride)
  return (useDebugFlags().address as string) || address
}
