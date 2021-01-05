import { baseToDisplay } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import { SortableLoan } from '../ducks/loans'
import { dateToYMDTechnical } from './date'

export const saveAsCSV = (loans: SortableLoan[]) => {
  const rows = [
    ['Asset ID', 'NFT ID', 'Financing Date', 'Maturity Date', 'Amount'],
    ...loans.map((loan: SortableLoan) => {
      return [
        loan.loanId,
        loan.tokenId,
        dateToYMDTechnical(loan.financingDate || 0),
        dateToYMDTechnical(loan.maturityDate || 0),
        baseToDisplay(
          loan.status === 'closed'
            ? loan.repaysAggregatedAmount || new BN(0)
            : loan.debt.isZero()
            ? loan.principal
            : loan.debt,
          18
        ),
      ]
    }),
  ]

  const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n')
  var encodedUri = encodeURI(csvContent)
  var link = document.createElement('a')
  link.setAttribute('href', encodedUri)
  link.setAttribute('download', 'assets.csv')
  document.body.appendChild(link) // Required for FF

  link.click()
}
