import { ActiveLoan, Loan, TinlakeLoan } from '@centrifuge/centrifuge-js'
import { StatusChip } from '@centrifuge/fabric'
import * as React from 'react'
import { daysBetween } from '../utils/date'

type LabelStatus = 'default' | 'info' | 'ok' | 'warning' | 'critical'

interface Props {
  loan: Loan | TinlakeLoan
}

export function getLoanLabelStatus(l: Loan | TinlakeLoan): [LabelStatus, string] {
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  if (l.status === 'Active' && (l as ActiveLoan).writeOffStatus) return ['critical', 'Write-off']
  if (l.status === 'Closed') return ['ok', 'Repaid']
  if (l.status === 'Active' && l.pricing.interestRate?.gtn(0) && l.totalBorrowed?.isZero()) return ['default', 'Ready']
  if (l.status === 'Created') return ['default', 'Created']

  if (l.status === 'Active' && 'maturityDate' in l.pricing && l.pricing.maturityDate) {
    if ('riskGroup' in l) return ['info', 'Ongoing']

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
  const [status, text] = getLoanLabelStatus(loan)
  return <StatusChip status={status}>{text}</StatusChip>
}

export default LoanLabel
