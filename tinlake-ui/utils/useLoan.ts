import { useQuery } from 'react-query'
import Apollo from '../services/apollo'

export function useLoan(poolId: string, loanId: string) {
  return useQuery(
    ['loans'],
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
