import { PoolMetadata } from '@centrifuge/centrifuge-js'
import * as React from 'react'
import { useMetadataMulti } from '../utils/useMetadata'
import { usePools } from '../utils/usePools'
import { useTinlakePools } from './tinlake/useTinlakePools'

export function useListedPools() {
  const pools = usePools()
  const tinlakePools = useTinlakePools()

  const poolMetas = useMetadataMulti<PoolMetadata>(pools?.map((p) => p.metadata) ?? [])

  const [listedPools, listedTokens] = React.useMemo(
    () => {
      const listedTinlakePools = tinlakePools.data?.pools ?? []
      const listedTinlakeTokens = listedTinlakePools.flatMap((p) => p.tranches)
      const listedPools = pools?.filter((_, i) => poolMetas[i]?.data?.pool?.listed) ?? []
      const listedTokens = listedPools.flatMap((p) => p.tranches)

      return [
        [...listedPools, ...listedTinlakePools],
        [...listedTokens, ...listedTinlakeTokens],
      ]
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [...poolMetas.map((q) => q.data), tinlakePools]
  )

  const isLoading = tinlakePools.isLoading || poolMetas.some((q) => q.isLoading)

  return [listedPools, listedTokens, isLoading] as const
}
