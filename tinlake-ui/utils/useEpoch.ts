import { useQuery } from 'react-query'
import { useSelector } from 'react-redux'
import { useTinlake } from '../components/TinlakeProvider'
import { getEpoch } from '../services/tinlake/actions'

export function useEpoch() {
  const tinlake = useTinlake()

  const address = useSelector<any, string | null>((state) => state.auth.address)
  const query = useQuery(['epoch', tinlake.contractAddresses.ROOT_CONTRACT, address], () => {
    return getEpoch(tinlake, address!)
  })

  return query
}
