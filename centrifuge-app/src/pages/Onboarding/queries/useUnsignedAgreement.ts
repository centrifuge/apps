import { useQuery } from 'react-query'
import { useAuth } from '../../../components/AuthProvider'
import { useOnboarding } from '../../../components/OnboardingProvider'

export const useUnsignedAgreement = () => {
  const { authToken } = useAuth()
  const { pool, onboardingUser } = useOnboarding()

  const isCompleted =
    onboardingUser?.poolSteps[pool.id][pool.trancheId].signAgreements.completed &&
    !!onboardingUser?.poolSteps[pool.id][pool.trancheId].signAgreements.transactionInfo.extrinsicHash

  const query = useQuery(
    ['unsigned-subscription-agreement', pool.id, pool.trancheId],
    async () => {
      const response = await fetch(
        `${import.meta.env.REACT_APP_ONBOARDING_API_URL}/getUnsignedAgreement?poolId=${pool.id}&trancheId=${
          pool.trancheId
        }`,
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
      enabled: !isCompleted,
      refetchOnWindowFocus: false,
    }
  )

  return query
}
