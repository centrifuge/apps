import { PoolMetadata } from '@centrifuge/centrifuge-js'
import BN from 'bn.js'
import * as React from 'react'
import { useAddress } from '../utils/useAddress'
import { useMetadataMulti } from '../utils/useMetadata'
import { usePermissions } from '../utils/usePermissions'
import { usePools } from '../utils/usePools'
import { getPoolTVL } from './getPoolTVL'
import { useTinlakePools } from './tinlake/useTinlakePools'

const sign = (n: BN) => (n.isZero() ? 0 : n.isNeg() ? -1 : 1)

export function useListedPools() {
  const pools = usePools()
  const tinlakePools = useTinlakePools()

  const address = useAddress('substrate')
  const permissions = usePermissions(address)

  const poolMetas = useMetadataMulti<PoolMetadata>(pools?.map((p) => p.metadata) ?? [])

  const [listedPools, listedTokens] = React.useMemo(
    () => {
      const poolVisibilities = pools?.map(({ id }) => !!permissions?.pools[id]) ?? []
      const listedTinlakePools = tinlakePools.data?.pools ?? []
      const listedTinlakeTokens = listedTinlakePools.flatMap((p) => p.tranches)
      const listedPools = pools?.filter((_, i) => poolMetas[i]?.data?.pool?.listed || poolVisibilities[i]) ?? []
      const listedTokens = listedPools.flatMap((p) => p.tranches)

      return [
        [...listedPools, ...listedTinlakePools].sort((a, b) => getPoolTVL(b) - getPoolTVL(a)),
        [...listedTokens, ...listedTinlakeTokens].sort((a, b) => sign(b.capacity.sub(a.capacity))),
      ]
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [...poolMetas.map((q) => q.data), tinlakePools, address]
  )

  const isLoading = tinlakePools.isLoading || poolMetas.some((q) => q.isLoading)

  return [listedPools, listedTokens, isLoading] as const
}
