import { useQuery } from 'react-query'
import { usePodAuth } from '../components/AuthProvider'
import { useCentrifuge } from '../components/CentrifugeProvider'
export function usePodDocument(podUrl: string | null | undefined, documentId: string | undefined) {
  const cent = useCentrifuge()
  const { session } = usePodAuth(podUrl)

  const query = useQuery(
    ['podDocument', podUrl, documentId, session],
    () => cent.pod.getCommittedDocument([podUrl!, session!.signed, documentId!]),
    {
      enabled: !!podUrl && !!documentId && !!session?.signed,
    }
  )
  return query
}
