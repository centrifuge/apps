import { baseToDisplay, feeToInterestRate, Loan } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import { dateToYMDTechnical } from './date'

export const saveAsCSV = (loans: Loan[]) => {
  const rows = [
    [
      'Asset ID',
      'NFT ID',
      'Financing Date',
      'Maturity Date',
      'Available for Financing',
      'Outstanding',
      'Repaid',
      'Financing Fee',
      'Status',
    ],
    ...loans.map((loan: Loan) => {
      return [
        loan.loanId,
        loan.tokenId,
        dateToYMDTechnical(loan.financingDate || 0),
        dateToYMDTechnical(loan.maturityDate || 0),
        baseToDisplay(loan.principal || new BN(0), 18),
        baseToDisplay(loan.debt || new BN(0), 18),
        baseToDisplay(loan.repaysAggregatedAmount || new BN(0), 18),
        feeToInterestRate(loan.interestRate),
        loan.status,
      ]
    }),
  ]

  downloadCSV(rows, 'assets.csv')
}

export const downloadCSV = (rows: any[], filename: string) => {
  const csvContent = `data:text/csv;charset=utf-8,${rows.map((e) => e.join(';')).join('\n')}`
  const encodedUri = encodeURI(csvContent)
  const link = document.createElement('a')
  link.setAttribute('href', encodedUri)
  link.setAttribute('download', filename)
  document.body.appendChild(link) // Required for FF

  link.click()
}
