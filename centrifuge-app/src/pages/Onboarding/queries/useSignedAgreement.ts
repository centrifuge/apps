import { useWallet } from '@centrifuge/centrifuge-react'
import * as React from 'react'
import { useQuery } from 'react-query'
import { useAuth } from '../../../components/AuthProvider'
import { useOnboarding } from '../../../components/OnboardingProvider'

export const useSignedAgreement = () => {
  const { authToken } = useAuth()
  const { pool, onboardingUser } = useOnboarding()
  const { selectedAccount } = useWallet()

  const [hasSignedAgreement, setHasSignedAgreement] = React.useState(false)

  React.useEffect(() => {
    if (onboardingUser) {
      setHasSignedAgreement(
        onboardingUser.poolSteps[pool.id][pool.trancheId].signAgreement.completed &&
          !!onboardingUser.poolSteps[pool.id][pool.trancheId].signAgreement.transactionInfo.extrinsicHash
      )
    }
  }, [onboardingUser?.poolSteps[pool.id][pool.trancheId].signAgreement, pool.id, pool.trancheId])

  const query = useQuery(
    ['signed-subscription-agreement', selectedAccount?.address, pool.id, pool.trancheId],
    async () => {
      const response = await fetch(
        `${import.meta.env.REACT_APP_ONBOARDING_API_URL}/getSignedAgreement?poolId=${pool.id}&trancheId=${
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

      const documentBlob = new Blob([Uint8Array.from(json.signedAgreement.data).buffer], {
        type: 'application/pdf',
      })

      return URL.createObjectURL(documentBlob)
    },
    {
      enabled: hasSignedAgreement,
      refetchOnWindowFocus: false,
    }
  )

  return query
}
