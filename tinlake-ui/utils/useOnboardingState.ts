import { AddressStatus } from '@centrifuge/onboarding-api/src/controllers/types'
import { useQuery } from 'react-query'
import { useDebugFlags } from '../components/DebugFlags'
import config, { Pool, UpcomingPool } from '../config'
import { useAddress } from './useAddress'

export function useOnboardingState(pool: Pool | UpcomingPool) {
  const debugValue = useDebugFlags().onboardingState
  const address = useAddress()
  const poolId = (pool as Pool).addresses?.ROOT_CONTRACT
  const query = useQuery<AddressStatus>(
    ['onboarding', poolId, address],
    () => fetch(`${config.onboardAPIHost}pools/${poolId}/addresses/${address}`).then((res) => res.json()),
    {
      enabled: !!poolId && !!address,
      staleTime: 60000,
    }
  )

  return debugValue ? { ...query, data: debugValue } : query
}
