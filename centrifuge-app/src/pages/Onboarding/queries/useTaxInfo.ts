import { useWallet } from '@centrifuge/centrifuge-react'
import { useQuery } from 'react-query'
import { useOnboardingAuth } from '../../../components/OnboardingAuthProvider'
import { useOnboarding } from '../../../components/OnboardingProvider'
import { getSelectedWallet } from '../../../utils/getSelectedWallet'

export const useTaxInfo = () => {
  const { authToken } = useOnboardingAuth()
  const wallet = useWallet()
  const { onboardingUser } = useOnboarding()

  const selectedWallet = getSelectedWallet(wallet)

  const query = useQuery(
    ['tax-info', selectedWallet?.address],
    async () => {
      const response = await fetch(`${import.meta.env.REACT_APP_ONBOARDING_API_URL}/getTaxInfo`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      const json = await response.json()

      const documentBlob = new Blob([Uint8Array.from(json.taxInfo.data).buffer], {
        type: 'application/pdf',
      })

      return URL.createObjectURL(documentBlob)
    },
    {
      refetchOnWindowFocus: false,
      enabled: !!onboardingUser?.globalSteps?.verifyTaxInfo?.completed,
    }
  )

  return query
}
