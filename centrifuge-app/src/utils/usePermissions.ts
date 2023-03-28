import { useCentrifugeQuery, useWallet } from '@centrifuge/centrifuge-react'
import { useAddress } from './useAddress'
import { useLoan } from './useLoans'
import { isSameAddress } from './web3'

export function usePermissions(address?: string) {
  const [result] = useCentrifugeQuery(['permissions', address], (cent) => cent.pools.getUserPermissions([address!]), {
    enabled: !!address,
  })
  return result
}

// Returns whether the connected address can borrow from a pool in principle
export function useCanBorrow(poolId: string) {
  const address = useAddress('substrate')
  const permissions = usePermissions(address)
  const { proxy } = useWallet().substrate
  const canBorrow =
    permissions?.pools[poolId]?.roles.includes('Borrower') &&
    (!proxy || proxy.types.includes('Borrow') || proxy.types.includes('Any'))

  return !!canBorrow
}

// Returns whether the connected address can borrow against a specific asset from a pool
export function useCanBorrowAsset(poolId: string, assetId: string) {
  const address = useAddress('substrate')
  const hasBorrowPermission = useCanBorrow(poolId)
  const loan = useLoan(poolId, assetId)
  const borrower = loan && 'borrower' in loan ? loan?.borrower : undefined
  const isLoanOwner = isSameAddress(borrower, address)
  const canBorrow = hasBorrowPermission && isLoanOwner

  return !!canBorrow
}

export function useIsPoolAdmin(poolId: string) {
  const address = useAddress('substrate')
  const permissions = usePermissions(address)

  return !!(address && permissions?.pools[poolId]?.roles.includes('PoolAdmin'))
}

export function useLiquidityAdmin(poolId: string) {
  const address = useAddress('substrate')
  const permissions = usePermissions(address)

  return !!(address && permissions?.pools[poolId]?.roles.includes('LiquidityAdmin'))
}
