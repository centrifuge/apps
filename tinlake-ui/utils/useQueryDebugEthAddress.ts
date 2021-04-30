import { useRouter } from 'next/router'

interface MaybeDebugEthAddressQuery {
  address?: string
  debug_eth_address?: string
}

export function useQueryDebugEthAddress(): string | null {
  const { address, debug_eth_address } = useRouter().query as MaybeDebugEthAddressQuery
  return address || debug_eth_address || null
}
