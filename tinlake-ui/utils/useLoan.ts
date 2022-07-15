import { useQuery } from 'react-query'
import Apollo from '../services/apollo'

export function useLoan(poolId: string, loanId: number) {
  return useQuery(
    ['loans', poolId, loanId],
    async () => {
      if (poolId && loanId) {
        const { data: loansData } = await Apollo.getLoans(poolId)
        const loanData = loansData.find((loan) => loan.loanId === loanId)

        return loanData
      }
    },
    { enabled: !!loanId && !!poolId }
  )
}
