import { useCentrifuge } from '@centrifuge/centrifuge-react'
import { useQuery } from 'react-query'
import { usePodAuth } from './usePodAuth'
import { usePodUrl } from './usePools'

export function usePodDocument(poolId: string, loanId: string, documentId: string | undefined) {
  const cent = useCentrifuge()
  const podUrl = usePodUrl(poolId)
  const { token, account } = usePodAuth(poolId)

  const query = useQuery(
    ['podDocument', podUrl, documentId, token],
    () => account.proxies?.length === 1 ? cent.pod.getCommittedDocument([podUrl!, token, documentId!]) : cent.pod.getInvestorAccess([podUrl!, token, documentId!, poolId!, loanId!]),
    {
      enabled: !!podUrl && !!documentId && !!token,
    }
  )
  return query
}
