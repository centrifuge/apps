import { useQuery } from 'react-query'
import { usePodAuth } from '../components/AuthProvider'
import { useCentrifuge } from '../components/CentrifugeProvider'

export function usePodDocument(podUrl: string | null | undefined, documentId: string | undefined) {
  const cent = useCentrifuge()
  const { authToken } = usePodAuth(podUrl)

  const query = useQuery(
    ['podDocument', podUrl, documentId, authToken],
    () => cent.pod.getCommittedDocument([podUrl!, authToken!.signed, documentId!]),
    {
      enabled: !!podUrl && !!documentId && !!authToken?.signed,
    }
  )
  return query
}
