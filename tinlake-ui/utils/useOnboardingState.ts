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

// TODO: Call onboard API URL that isn't pool dependant
const placeholderPoolId = '0x560Ac248ce28972083B718778EEb0dbC2DE55740'

export function useInvestorOnboardingState() {
  const debugValue = useDebugFlags().onboardingState
  const address = useAddress()
  const query = useQuery<Omit<AddressStatus, 'agreements' | 'restrictedPool'>>(
    ['onboarding', address],
    () => fetch(`${config.onboardAPIHost}pools/${placeholderPoolId}/addresses/${address}`).then((res) => res.json()),
    {
      enabled: !!address,
      staleTime: 60000,
    }
  )

  return debugValue ? { ...query, data: debugValue } : query
}
