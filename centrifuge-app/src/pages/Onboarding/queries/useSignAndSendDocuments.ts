import { useMutation } from 'react-query'
import { useOnboardingAuth } from '../../../components/OnboardingAuthProvider'
import { OnboardingPool, useOnboarding } from '../../../components/OnboardingProvider'
import { OnboardingUser } from '../../../types'

export const useSignAndSendDocuments = () => {
  const { refetchOnboardingUser, pool, nextStep } = useOnboarding<OnboardingUser, NonNullable<OnboardingPool>>()
  const { authToken } = useOnboardingAuth()

  const poolId = pool.id
  const trancheId = pool.trancheId

  const mutation = useMutation(
    async (transactionInfo: { txHash: string; blockNumber: string }) => {
      const response = await fetch(`${import.meta.env.REACT_APP_ONBOARDING_API_URL}/signAndSendDocuments`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionInfo,
          trancheId,
          poolId,
        }),
        credentials: 'include',
      })

      if (response.status === 201) {
        return response
      }
      throw response.statusText
    },
    {
      onSuccess: () => {
        refetchOnboardingUser()
        nextStep()
      },
    }
  )

  return mutation
}
