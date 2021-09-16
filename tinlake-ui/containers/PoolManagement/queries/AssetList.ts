import { baseToDisplay, feeToInterestRate } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import { dateToYMDTechnical } from '../../../utils/date'
import { downloadCSV } from '../../../utils/export'
import { getAssets, SortableLoan } from '../../../utils/useAssets'
import { csvName } from './index'

export async function assetList(poolId: string) {
  const loans = await getAssets(poolId)

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
    ...loans.map((loan: SortableLoan) => {
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

  downloadCSV(rows, csvName(`Asset List`))
  return true
}
