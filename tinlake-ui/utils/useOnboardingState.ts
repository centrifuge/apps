import { AddressStatus } from '@centrifuge/onboarding-api/src/controllers/types'
import { useQuery } from 'react-query'
import { useDebugFlags } from '../components/DebugFlags'
import config, { Pool, UpcomingPool } from '../config'
import { useAddress } from './useAddress'

type Tranche = 'junior' | 'senior'

const DefaultTranche = 'senior'

export function useOnboardingState(pool?: Pool | UpcomingPool, tranche?: Tranche, overrideAddress?: string) {
  const debugValue = useDebugFlags().onboardingState
  const address = useAddress()
  const poolId = (pool as Pool)?.addresses?.ROOT_CONTRACT
  const query = useQuery<AddressStatus>(
    ['onboarding', poolId, overrideAddress || address, debugValue],
    async () =>
      debugValue ||
      fetch(`${config.onboardAPIHost}pools/${poolId}/addresses/${address}?tranche=${tranche || DefaultTranche}`).then(
        (res) => res.json()
      ),
    {
      enabled: !!poolId && !!(overrideAddress || address),
      staleTime: 60000,
    }
  )

  return query
}

// TODO: Call onboard API URL that isn't pool dependant
const placeholderPoolId = '0x560Ac248ce28972083B718778EEb0dbC2DE55740'

type AdditionalData = {
  kycStatus: AddressStatus['kyc']['status'] | 'requires-signin'
  accreditationStatus: boolean
  completed: boolean
}

export function useInvestorOnboardingState() {
  const debugValue = useDebugFlags().onboardingState
  const address = useAddress()
  const query = useQuery<Omit<AddressStatus, 'agreements' | 'restrictedPool'> & AdditionalData>(
    ['onboarding', address, debugValue],
    async () => {
      const data =
        debugValue ||
        (await fetch(`${config.onboardAPIHost}pools/${placeholderPoolId}/addresses/${address}`).then((res) =>
          res.json()
        ))

      const kycStatus = data?.kyc?.requiresSignin ? 'requires-signin' : data?.kyc?.status
      const accreditationStatus = data?.kyc?.isUsaTaxResident ? data?.kyc?.accredited || false : true
      const completed = kycStatus === 'verified' && accreditationStatus
      return {
        ...data,
        kycStatus,
        accreditationStatus,
        completed,
      }
    },
    {
      enabled: !!address,
      staleTime: 60000,
    }
  )

  return query
}
