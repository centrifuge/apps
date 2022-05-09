import { Loan } from '@centrifuge/centrifuge-js'
import { StatusChip } from '@centrifuge/fabric'
import * as React from 'react'
import { daysBetween } from '../utils/date'

type LabelStatus = 'default' | 'info' | 'ok' | 'warning' | 'critical'

interface Props {
  loan: Loan
}

const LoanLabel: React.FC<Props> = ({ loan }) => {
  function getLabelStatus(l: Loan): [LabelStatus, string] {
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)
    if (l.status === 'Closed') return ['info', 'Closed']
    if (l.status === 'Created') return ['info', 'Created']
    if (!l.interestRatePerSec.isZero()) return ['ok', 'Ongoing']
    if (!('maturityDate' in l.loanInfo)) return ['ok', 'Ongoing']

    const days = daysBetween(today, l.loanInfo.maturityDate)

    if (l.status === 'Active' && days === 0) return ['warning', 'due today']
    if (l.status === 'Active' && days === 1) return ['warning', 'due tomorrow']
    if (l.status === 'Active' && days > 1 && days <= 5) return ['warning', `due in ${days} days`]
    if (l.status === 'Active' && days < 0) return ['critical', `due ${Math.abs(days)} days ago`]
    return ['ok', 'Ongoing']
  }

  const [status, text] = getLabelStatus(loan)

  return <StatusChip status={status}>{text}</StatusChip>
}

export default LoanLabel
