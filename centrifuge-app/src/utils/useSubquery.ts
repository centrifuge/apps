import { useCentrifuge } from '@centrifuge/centrifuge-react'
import { useQuery } from 'react-query'
import { firstValueFrom } from 'rxjs'

export function useSubquery(query: string, variables?: object) {
  const cent = useCentrifuge()
  return useQuery(['subquery', query, variables], () =>
    firstValueFrom(cent.getSubqueryObservable(query, variables, false))
  )
}
