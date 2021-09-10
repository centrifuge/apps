import { Loan } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import { useQuery } from 'react-query'
import Apollo from '../services/apollo'

// SortableLoan adds properties of number type that support sorting in numerical order for grommet DataTable
export interface SortableLoan extends Loan {
  amountNum: number
  debtNum: number
  principalNum: number
  interestRateNum: number
  borrowsAggregatedAmountNum: number
  repaysAggregatedAmountNum: number
}

export function useAssets(poolId: string) {
  const query = useQuery(['assets', poolId], () => getAssets(poolId))

  return query
}

async function getAssets(poolId: string) {
  const result = await Apollo.getLoans(poolId)

  const loans: SortableLoan[] = result.data.map((l) => ({
    ...l,
    amountNum: l.debt.isZero() ? parseFloat(l.principal.toString()) : parseFloat(l.debt.toString()),
    debtNum: parseFloat(l.debt.toString()),
    principalNum: parseFloat(l.principal.toString()),
    interestRateNum: parseFloat(l.interestRate.toString()),
    borrowsAggregatedAmountNum: parseFloat((l.borrowsAggregatedAmount || new BN(0)).toString()),
    repaysAggregatedAmountNum: parseFloat((l.repaysAggregatedAmount || new BN(0)).toString()),
    maturityDate: l.maturityDate,
  }))
  return loans
}
