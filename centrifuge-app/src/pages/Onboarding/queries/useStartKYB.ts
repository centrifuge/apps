import { useMutation } from 'react-query'
import { useOnboardingAuth } from '../../../components/OnboardingAuthProvider'
import { useOnboarding } from '../../../components/OnboardingProvider'
import { Indentity, KYBResponse } from '../KnowYourBusiness/declarations'

export const useStartKYB = () => {
  const { authToken } = useOnboardingAuth()
  const { pool, onboardingUser, refetchOnboardingUser } = useOnboarding()

  const investorType = onboardingUser?.investorType === 'entity' ? 'entity' : 'individual'

  const mutation = useMutation(
    async (values: Indentity) => {
      const response = await fetch(`${import.meta.env.REACT_APP_ONBOARDING_API_URL}/startKYB`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          businessName: values.businessName,
          email: values.email,
          registrationNumber: values.registrationNumber,
          jurisdictionCode: values.jurisdictionCode,
          // todo: check if 'regionCode' can ever be relevant
          ...(values.regionCode ? { regionCode: values.regionCode } : {}),
        }),
      })

      const json: KYBResponse = await response.json()
      return json
    },
    {
      onSuccess: () => {
        console.log('onSuccess callback in "useStartKYB"')
        // refetchOnboardingUser()
      },
    }
  )

  return mutation
}
