import { useQuery } from 'react-query'
import { useSelector } from 'react-redux'
import { useIpfsPools } from '../components/IpfsPoolsProvider'
import { initTinlake } from '../services/tinlake'
import { getEpoch } from '../services/tinlake/actions'

export function useEpoch(poolId?: string) {
  const ipfsPools = useIpfsPools()

  const address = useSelector<any, string | null>((state) => state.auth.address)
  const query = useQuery(
    ['epoch', poolId, address],
    () => {
      const pool = ipfsPools.active.find((p) => p.addresses.ROOT_CONTRACT === poolId)
      const tinlake = initTinlake({ addresses: pool?.addresses, contractConfig: pool?.contractConfig })
      return getEpoch(tinlake, address!)
    },
    {
      enabled: !!poolId,
    }
  )

  return query
}
