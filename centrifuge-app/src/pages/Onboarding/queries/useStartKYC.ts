import { useMutation } from 'react-query'
import { useOnboardingAuth } from '../../../components/OnboardingAuthProvider'
import { useOnboarding } from '../../../components/OnboardingProvider'

type Indentity = {
  name: string
  email?: string
  dateOfBirth: string
  countryOfCitizenship: string
  countryOfResidency: string
}

export const useStartKYC = () => {
  const { authToken } = useOnboardingAuth()
  const { pool, onboardingUser, refetchOnboardingUser } = useOnboarding()

  const investorType = onboardingUser?.investorType === 'entity' ? 'entity' : 'individual'

  const mutation = useMutation(
    async (values: Indentity) => {
      const response = await fetch(`${import.meta.env.REACT_APP_ONBOARDING_API_URL}/startKYC`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: values.name,
          dateOfBirth: values.dateOfBirth,
          countryOfCitizenship: values.countryOfCitizenship,
          countryOfResidency: values.countryOfResidency,
          ...(investorType === 'individual' && { email: values.email }),
        }),
      })

      return response.json()
    },
    {
      onSuccess: () => {
        refetchOnboardingUser()
      },
    }
  )

  return mutation
}
