import * as React from 'react'
import { useAddress } from '../../utils/useAddress'
import { usePermissions } from '../../utils/usePermissions'
import { usePoolMetadata, usePools } from '../../utils/usePools'

/**
 * Looks for an already existing pool by this issuer and if found,
 * gets the metadata for that pool and returns the issuer information
 */
export function useStoredIssuer() {
  const allPools = usePools()
  const address = useAddress()
  const permissions = usePermissions(address)

  const pools = React.useMemo(() => {
    if (!allPools || !permissions) {
      return []
    }
    return allPools.filter(({ id, metadata }) => permissions[id]?.roles.includes('PoolAdmin') && metadata)
  }, [allPools, permissions])

  const { data, isLoading } = usePoolMetadata(pools[0])

  return {
    data: data?.pool?.issuer,
    isLoading: isLoading || !permissions,
  }
}
