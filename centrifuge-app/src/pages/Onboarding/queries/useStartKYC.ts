import { useMutation } from 'react-query'
import { useOnboardingAuth } from '../../../components/OnboardingAuthProvider'
import { useOnboarding } from '../../../components/OnboardingProvider'

type Indentity = {
  name: string
  dateOfBirth: string
  countryOfCitizenship: string
  countryOfResidency: string
}

export const useStartKYC = () => {
  const { authToken } = useOnboardingAuth()
  const { pool, onboardingUser } = useOnboarding()

  const mutation = useMutation(async (values: Indentity) => {
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
        ...(onboardingUser?.investorType === undefined && { poolId: pool?.id, trancheId: pool?.trancheId }),
      }),
    })

    return response.json()
  })

  return mutation
}
