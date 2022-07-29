import { useQuery } from 'react-query'
import Apollo from '../services/apollo'

export function useLoan(poolId: string, loanId: number) {
  return useQuery(
    ['loans', poolId, loanId],
    async () => {
      if (poolId && loanId) {
        const { data: loansData } = await Apollo.getLoans(poolId)
        // @ts-expect-error
        // loan.loanId is a number, but the Loan type is incorrectly typed here: https://github.com/centrifuge/apps/blob/main/tinlake.js/src/types/tinlake.ts#L13
        const loanData = loansData.find((loan) => loan.loanId === loanId)

        return loanData
      }
    },
    { enabled: !!loanId && !!poolId }
  )
}
