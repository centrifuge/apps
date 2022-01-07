import Centrifuge from '@centrifuge/centrifuge-js'
import { StatusChip } from '@centrifuge/fabric'
import * as React from 'react'
import { daysBetween } from '../utils/date'

type PromiseResult<T> = T extends Promise<infer R> ? R : never
type QueryReturnType<T extends (...args: any) => any> = PromiseResult<ReturnType<T>>
type Loan = QueryReturnType<Centrifuge['pools']['getLoan']>

type LabelStatus = 'default' | 'info' | 'ok' | 'warning' | 'critical'

interface Props {
  loan: Loan
}

const LoanLabel: React.FC<Props> = ({ loan }) => {
  const getStatus = (l: Loan): LabelStatus => {
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)
    const days = daysBetween(today.getTime() / 1000, Number(l.loanType.maturityDate))

    if (l.status === 'Active' && days >= 0 && days <= 5) return 'warning'
    if (l.status === 'Active' && days < 0) return 'critical'
    if (l.status === 'Closed') return 'default'
    if (l.status === 'Issued') return 'default'
    return 'ok'
  }

  const getLabelText = (l: Loan) => {
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)
    const days = daysBetween(today.getTime() / 1000, Number(l.loanType.maturityDate))

    if (l.status === 'Active' && days === 0) return 'due today'
    if (l.status === 'Active' && days === 1) return 'due tomorrow'
    if (l.status === 'Active' && days > 1 && days <= 5) return `due in ${days} days`
    if (l.status === 'Active' && days < 0) return `due ${Math.abs(days)} days ago`
    if (l.status === 'Active') return 'Ongoing'
    if (l.status === 'Issued') return 'NFT Locked'
    return 'Closed'
  }

  const labelStatus = getStatus(loan)
  const text = getLabelText(loan)

  return <StatusChip status={labelStatus}>{text}</StatusChip>
}

export default LoanLabel
