import { useQuery } from 'react-query'
import { useAuth } from '../../../components/AuthProvider'
import { useOnboarding } from '../../../components/OnboardingProvider'

export const useUnsignedAgreement = () => {
  const { authToken } = useAuth()
  const { pool, onboardingUser } = useOnboarding()

  const poolId = pool?.id as string
  const trancheId = pool?.trancheId as string

  const hasSignedAgreement = !!onboardingUser?.poolSteps[poolId]?.[trancheId].signAgreement.completed

  const query = useQuery(
    ['unsigned-subscription-agreement', poolId, trancheId],
    async () => {
      const response = await fetch(
        `${import.meta.env.REACT_APP_ONBOARDING_API_URL}/getUnsignedAgreement?poolId=${poolId}&trancheId=${trancheId}`,
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

      const documentBlob = new Blob([Uint8Array.from(json.unsignedAgreement.data).buffer], {
        type: 'application/pdf',
      })

      return URL.createObjectURL(documentBlob)
    },
    {
      enabled: !hasSignedAgreement,
      refetchOnWindowFocus: false,
    }
  )

  return query
}
