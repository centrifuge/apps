import { useWeb3 } from '../components/Web3Provider'
import { useAddress } from './useAddress'
import { useCentrifugeQuery } from './useCentrifugeQuery'
import { useLoanNft } from './useNFTs'
import { isSameAddress } from './web3'

export function usePermissions(address?: string) {
  const [result] = useCentrifugeQuery(['permissions', address], (cent) => cent.pools.getUserPermissions([address!]), {
    enabled: !!address,
  })
  return result
}

export function useCanBorrow(poolId: string, assetId: string) {
  const address = useAddress()
  const permissions = usePermissions(address)
  const { proxy } = useWeb3()
  const loanNft = useLoanNft(poolId, assetId)
  const isLoanOwner = isSameAddress(loanNft?.owner, address)
  const canBorrow =
    permissions?.pools[poolId]?.roles.includes('Borrower') &&
    isLoanOwner &&
    (!proxy || proxy.types.includes('Borrower') || proxy.types.includes('Any'))

  return !!canBorrow
}

export function useIsPoolAdmin(poolId: string) {
  const address = useAddress()
  const permissions = usePermissions(address)

  return !!(address && permissions?.pools[poolId]?.roles.includes('PoolAdmin'))
}

export function useLiquidityAdmin(poolId: string) {
  const address = useAddress()
  const permissions = usePermissions(address)

  return !!(address && permissions?.pools[poolId]?.roles.includes('LiquidityAdmin'))
}
