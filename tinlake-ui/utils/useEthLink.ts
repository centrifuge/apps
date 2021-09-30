import { useQuery } from 'react-query'
import config from '../config'
import { ZERO_BYTES_32 } from '../constants'
import { multicall } from './multicall'
import { useAddress } from './useAddress'

export function useEthLink() {
  const ethAddr = useAddress()
  const query = useQuery(
    ['ethLink', ethAddr],
    async () => {
      const { link } = await multicall([
        {
          target: config.claimCFGContractAddress,
          call: ['accounts(address)(bytes32)', ethAddr!],
          returns: [['link']],
        },
      ])
      return link !== ZERO_BYTES_32 ? link : null
    },
    {
      enabled: !!ethAddr,
    }
  )

  return query
}
