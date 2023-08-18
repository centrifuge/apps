import { Network, useTransactions } from '@centrifuge/centrifuge-react'
import { useMutation } from 'react-query'
import { useOnboardingAuth } from '../../../components/OnboardingAuthProvider'
import { OnboardingPool, useOnboarding } from '../../../components/OnboardingProvider'
import { OnboardingUser } from '../../../types'

export const useSignAndSendDocuments = () => {
  const { refetchOnboardingUser, pool, nextStep } = useOnboarding<OnboardingUser, NonNullable<OnboardingPool>>()
  const { authToken } = useOnboardingAuth()
  const { addOrUpdateTransaction } = useTransactions()
  const txIdSendDocs = Math.random().toString(36).substr(2)

  const poolId = pool.id
  const trancheId = pool.trancheId

  const mutation = useMutation(
    async (transactionInfo: { txHash: string; blockNumber: string; chainId: Network }) => {
      addOrUpdateTransaction({
        id: txIdSendDocs,
        title: `Send documents to issuers`,
        status: 'pending',
        args: [],
      })

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
        addOrUpdateTransaction({
          id: txIdSendDocs,
          title: `Send documents to issuers`,
          status: 'succeeded',
          args: [],
        })
        return response
      }
      addOrUpdateTransaction({
        id: txIdSendDocs,
        title: `Send documents to issuers`,
        status: 'failed',
        args: ['An error occured uploading documents'],
      })
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
