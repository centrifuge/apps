import { useQuery } from 'react-query'
import { useCentrifuge } from '../components/CentrifugeProvider'
import { useAuth } from '../components/PodAuthProvider'

export function usePodDocument(podUrl: string | null | undefined, documentId: string | undefined) {
  const cent = useCentrifuge()
  const { authToken } = useAuth()

  const query = useQuery(
    ['podDocument', podUrl, documentId, authToken],
    () => cent.pod.getCommittedDocument([podUrl!, authToken, documentId!]),
    {
      enabled: !!podUrl && !!documentId && !!authToken,
    }
  )
  return query
}
