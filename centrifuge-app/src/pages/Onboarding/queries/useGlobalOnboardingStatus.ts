import { useCentrifuge, useWallet } from '@centrifuge/centrifuge-react'
import { encodeAddress } from '@polkadot/util-crypto'
import { useQuery } from 'react-query'
import { getSelectedWallet } from '../../../utils/getSelectedWallet'

export const useGlobalOnboardingStatus = () => {
  const wallet = useWallet()
  const cent = useCentrifuge()

  const selectedWallet = getSelectedWallet(wallet)

  const query = useQuery(
    ['global-onboarding-status', selectedWallet?.address],
    async () => {
      if (selectedWallet && selectedWallet.address) {
        const chainId = await cent.getChainId()
        const address =
          selectedWallet.network === 'substrate'
            ? encodeAddress(selectedWallet.address, chainId)
            : selectedWallet.address
        const response = await fetch(
          `${import.meta.env.REACT_APP_ONBOARDING_API_URL}/getGlobalOnboardingStatus?address=${address}&network=${
            selectedWallet.network
          }&chainId=${wallet.connectedNetwork}`,
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
