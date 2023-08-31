import { useWallet } from '@centrifuge/centrifuge-react'
import { useQuery } from 'react-query'
import { getSelectedWallet } from '../../../utils/getSelectedWallet'

export const useGlobalOnboardingStatus = () => {
  const wallet = useWallet()

  const selectedWallet = getSelectedWallet(wallet)

  const query = useQuery(
    ['global-onboarding-status', selectedWallet?.address],
    async () => {
      if (selectedWallet) {
        const response = await fetch(
          `${import.meta.env.REACT_APP_ONBOARDING_API_URL}/getGlobalOnboardingStatus?address=${
            selectedWallet.address
          }&network=${selectedWallet.network}&chainId=${wallet.connectedNetwork}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )

        const json = await response.json()

        return json.onboardingGlobalStatus
      }
    },
    {
      enabled: !!selectedWallet,
    }
  )

  return query
}
