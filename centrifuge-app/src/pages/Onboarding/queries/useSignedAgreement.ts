import { useWallet } from '@centrifuge/centrifuge-react'
import * as React from 'react'
import { useQuery } from 'react-query'
import { useOnboardingAuth } from '../../../components/OnboardingAuthProvider'
import { useOnboarding } from '../../../components/OnboardingProvider'
import { getSelectedWallet } from '../../../utils/getSelectedWallet'

export const useSignedAgreement = () => {
  const { authToken } = useOnboardingAuth()
  const { pool, onboardingUser } = useOnboarding()
  const wallet = useWallet()

  const selectedWallet = getSelectedWallet(wallet)

  const [hasSignedAgreement, setHasSignedAgreement] = React.useState(false)

  const poolId = pool?.id as string
  const trancheId = pool?.trancheId as string

  React.useEffect(() => {
    if (onboardingUser && poolId && trancheId) {
      setHasSignedAgreement(!!onboardingUser.poolSteps?.[poolId]?.[trancheId].signAgreement.completed)
    }
  }, [onboardingUser, poolId, trancheId])

  const query = useQuery(
    ['signed-subscription-agreement', selectedWallet?.address, pool?.id, pool?.trancheId],
    async () => {
      const response = await fetch(
        `${import.meta.env.REACT_APP_ONBOARDING_API_URL}/getSignedAgreement?poolId=${poolId}&trancheId=${trancheId}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        }
      )

      const json = await response.json()

      const documentBlob = new Blob([Uint8Array.from(json.signedAgreement.data).buffer], {
        type: 'application/pdf',
      })

      return URL.createObjectURL(documentBlob)
    },
    {
      enabled: hasSignedAgreement && !!pool,
      refetchOnWindowFocus: false,
    }
  )

  return query
}
