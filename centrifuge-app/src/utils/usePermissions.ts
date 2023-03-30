import { PoolRoles } from '@centrifuge/centrifuge-js'
import { computeMultisig, useCentrifugeQuery, useWallet } from '@centrifuge/centrifuge-react'
import { useMemo } from 'react'
import { useAddress } from './useAddress'
import { useLoanNft } from './useNFTs'
import { usePool, usePoolMetadata } from './usePools'
import { isSameAddress } from './web3'

export function usePermissions(address?: string) {
  const [result] = useCentrifugeQuery(['permissions', address], (cent) => cent.pools.getUserPermissions([address!]), {
    enabled: !!address,
  })
  return result
}

export function usePoolPermissions(poolId?: string) {
  const [result] = useCentrifugeQuery(['poolPermissions', poolId], (cent) => cent.pools.getPoolPermissions([poolId!]), {
    enabled: !!poolId,
  })

  return result
}

// Returns whether the connected address can borrow from a pool in principle
export function useCanBorrow(poolId: string) {
  const address = useAddress('substrate')
  const permissions = usePermissions(address)
  const { selectedProxies } = useWallet().substrate
  const proxy = selectedProxies?.at(-1)
  const canBorrow =
    permissions?.pools[poolId]?.roles.includes('Borrower') &&
    (!proxy || proxy.types.includes('Borrow') || proxy.types.includes('Any'))

  return !!canBorrow
}

// Returns whether the connected address can borrow against a specific asset from a pool
export function useCanBorrowAsset(poolId: string, assetId: string) {
  const address = useAddress('substrate')
  const hasBorrowPermission = useCanBorrow(poolId)
  const loanNft = useLoanNft(poolId, assetId)
  const isLoanOwner = isSameAddress(loanNft?.owner, address)
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

export function useSuitableAccountForTx({
  actingAddress,
  poolRoles,
}: {
  actingAddress?: string
  poolRoles?: PoolRoles['roles'][0] | { TrancheInvestor: string }
}) {
  const {
    substrate: { selectAccount, combinedAccounts },
  } = useWallet()
}

export function usePoolAccess(poolId: string) {
  const {
    substrate: { proxies },
  } = useWallet()
  const poolPermissions = usePoolPermissions(poolId)
  console.log('poolPermissions', poolPermissions)
  const pool = usePool(poolId)
  const { data: metadata } = usePoolMetadata(pool)
  const admin =
    poolPermissions &&
    Object.entries(poolPermissions).find(([, poolRoles]) => poolRoles.roles.includes('PoolAdmin'))?.[0]
  const aoProxies =
    (admin &&
      proxies?.[admin]
        ?.filter((p) => p.types.includes('Any') && poolPermissions[p.delegator]?.roles.includes('Borrower'))
        .map((p) => p.delegator)) ||
    null
  return {
    admin,
    multisig: useMemo(
      () => (metadata?.adminMultisig && computeMultisig(metadata.adminMultisig)) || null,
      [metadata?.adminMultisig]
    ),
    aoProxies,
  }
}
