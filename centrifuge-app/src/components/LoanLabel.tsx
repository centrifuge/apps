import { Loan } from '@centrifuge/centrifuge-js'
import { StatusChip } from '@centrifuge/fabric'
import * as React from 'react'
import { daysBetween } from '../utils/date'

type LabelStatus = 'default' | 'info' | 'ok' | 'warning' | 'critical'

interface Props {
  loan: Loan
}

export function getLoanLabelStatus(l: Loan): [LabelStatus, string] {
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  if (l.adminWrittenOff) return ['critical', 'Write-off']
  if (l.status === 'Closed') return ['ok', 'Repaid']
  if (l.status === 'Created') return ['default', 'Created']
  if (!l.interestRatePerSec.isZero() && l.totalBorrowed.isZero()) return ['default', 'Ready']
  if (!('maturityDate' in l.loanInfo)) return ['info', 'Ongoing']

  const days = daysBetween(today, l.loanInfo.maturityDate)

  if (l.status === 'Active' && days === 0) return ['warning', 'due today']
  if (l.status === 'Active' && days === 1) return ['warning', 'due tomorrow']
  if (l.status === 'Active' && days > 1 && days <= 5) return ['warning', `due in ${days} days`]
  if (l.status === 'Active' && days < 0) return ['critical', `due ${Math.abs(days)} days ago`]
  return ['info', 'Ongoing']
}

const LoanLabel: React.FC<Props> = ({ loan }) => {
  const [status, text] = getLoanLabelStatus(loan)
  return <StatusChip status={status}>{text}</StatusChip>
}

export default LoanLabel
