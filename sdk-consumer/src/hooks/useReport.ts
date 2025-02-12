import { useMemo } from 'react'
import { useCentrifugeQuery } from './useCentrifugeQuery'
import { usePool } from './usePool'

export function useBalanceSheet(poolId: string) {
  const pool = usePool(poolId)

  const report$ = useMemo(() => pool?.reports.balanceSheet({ to: new Date().toISOString() }), [pool])

  return useCentrifugeQuery(report$)
}
