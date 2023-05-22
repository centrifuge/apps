import { useMutation } from 'react-query'
import { useOnboardingAuth } from '../../../components/OnboardingAuthProvider'

export const useSendVerifyEmail = () => {
  const { authToken } = useOnboardingAuth()

  const mutation = useMutation(async () => {
    const response = await fetch(`${import.meta.env.REACT_APP_ONBOARDING_API_URL}/sendVerifyEmail`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })

    if (response.status !== 200) {
      throw new Error()
    }
  })

  return mutation
}
