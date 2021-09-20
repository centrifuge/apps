import { useQuery } from 'react-query'
import { useSelector } from 'react-redux'
import config from '../config'
import { multicall } from './multicall'

export function useEthLink(addressOverride?: string | null) {
  const addressState = useSelector<any, string | null>((state) => state.auth.address)
  const ethAddr = addressOverride || addressState
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
      return link !== '0x0000000000000000000000000000000000000000000000000000000000000000' ? link : null
    },
    {
      enabled: !!ethAddr,
    }
  )

  return query
}
