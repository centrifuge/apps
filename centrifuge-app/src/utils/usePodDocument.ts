import { useCentrifuge } from '@centrifuge/centrifuge-react'
import { useQuery } from 'react-query'
import { useOnboardingAuth } from '../components/OnboardingAuthProvider'

export function usePodDocument(podUrl: string | null | undefined, documentId: string | undefined) {
  const cent = useCentrifuge()
  const { authToken } = useOnboardingAuth()

  const query = useQuery(
    ['podDocument', podUrl, documentId, authToken],
    () => cent.pod.getCommittedDocument([podUrl!, authToken, documentId!]),
    {
      enabled: !!podUrl && !!documentId && !!authToken,
    }
  )
  return query
}
