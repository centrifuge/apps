import { useCentrifuge } from '@centrifuge/centrifuge-react'
import { useQuery } from 'react-query'
import { usePodAuth } from './usePodAuth'
import { usePodUrl } from './usePools'

export function usePodDocument(poolId: string, documentId: string | undefined) {
  const cent = useCentrifuge()
  const podUrl = usePodUrl(poolId)
  const { token } = usePodAuth(poolId)

  const query = useQuery(
    ['podDocument', podUrl, documentId, token],
    () => cent.pod.getCommittedDocument([podUrl!, token, documentId!]),
    {
      enabled: !!podUrl && !!documentId && !!token,
    }
  )
  return query
}
