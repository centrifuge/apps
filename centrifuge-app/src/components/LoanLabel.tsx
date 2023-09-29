import { ActiveLoan, Loan, TinlakeLoan } from '@centrifuge/centrifuge-js'
import { StatusChip } from '@centrifuge/fabric'
import * as React from 'react'
import { daysBetween } from '../utils/date'

type LabelStatus = 'default' | 'info' | 'ok' | 'warning' | 'critical'

interface Props {
  loan: Loan | TinlakeLoan
}

export function getLoanLabelStatus(l: Loan | TinlakeLoan, isExternalAssetRepaid?: boolean): [LabelStatus, string] {
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  if (l.status === 'Active' && (l as ActiveLoan).writeOffStatus) return ['critical', 'Write-off']
  if (l.status === 'Closed' || isExternalAssetRepaid) return ['ok', 'Repaid']
  if (
    l.status === 'Active' &&
    'interestRate' in l.pricing &&
    l.pricing.interestRate?.gtn(0) &&
    l.totalBorrowed?.isZero()
  )
    return ['default', 'Ready']
  if (l.status === 'Created') return ['default', 'Created']

  if (l.status === 'Active' && 'maturityDate' in l.pricing && l.pricing.maturityDate) {
    const isTinlakeLoan = 'riskGroup' in l
    if (isTinlakeLoan) return ['info', 'Ongoing']

    const days = daysBetween(today, l.pricing.maturityDate)
    if (days === 0) return ['warning', 'Due today']
    if (days === 1) return ['warning', 'Due tomorrow']
    if (days > 1 && days <= 5) return ['warning', `Due in ${days} days`]
    if (days === -1) return ['critical', `Due ${Math.abs(days)} day ago`]
    if (days < -1) return ['critical', `Due ${Math.abs(days)} days ago`]
  }
  return ['info', 'Ongoing']
}

const LoanLabel: React.FC<Props> = ({ loan }) => {
  const currentFace =
    loan.pricing && 'outstandingQuantity' in loan.pricing
      ? loan.pricing.outstandingQuantity.toDecimal().mul(loan.pricing.notional.toDecimal())
      : null

  const isExternalAssetRepaid = currentFace?.isZero() && loan.status === 'Active'
  const [status, text] = getLoanLabelStatus(loan, isExternalAssetRepaid)
  return <StatusChip status={status}>{text}</StatusChip>
}

export default LoanLabel
