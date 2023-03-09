import { useMutation } from 'react-query'
import { useAuth } from '../../../components/AuthProvider'
import { useOnboarding } from '../../../components/OnboardingProvider'

export const useSignAndSendDocuments = () => {
  const { refetchOnboardingUser, pool, nextStep } = useOnboarding()
  const { authToken } = useAuth()

  const poolId = pool?.id as string
  const trancheId = pool?.trancheId as string

  const mutation = useMutation(
    async (transactionInfo: { extrinsicHash: string; blockNumber: string }) => {
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
