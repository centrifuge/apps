import { AddressStatus } from '@centrifuge/onboarding-api/src/controllers/types'
import { useQuery } from 'react-query'
import { useSelector } from 'react-redux'
import config, { Pool, UpcomingPool } from '../config'

export function useOnboardingState(pool: Pool | UpcomingPool) {
  const address = useSelector<any, string | null>((state) => state.auth.address)
  const poolId = (pool as Pool).addresses?.ROOT_CONTRACT
  const query = useQuery<AddressStatus>(
    ['onboarding', poolId, address],
    () => fetch(`${config.onboardAPIHost}pools/${poolId}/addresses/${address}`).then((res) => res.json()),
    {
      enabled: !!poolId && !!address,
      staleTime: 60000,
    }
  )

  return query
}
