import { useCentrifuge } from '@centrifuge/centrifuge-react'
import { UseQueryOptions, useQuery } from 'react-query'
import { firstValueFrom } from 'rxjs'

export function useSubquery<T = any>(query: string, variables?: object, options?: Omit<UseQueryOptions, 'queryKey'>) {
  const cent = useCentrifuge()
  return useQuery<T>(
    ['subquery', query, variables],
    () => firstValueFrom(cent.getSubqueryObservable(query, variables, false)) as any,
    options as any
  )
}
