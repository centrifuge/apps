import { ActiveLoan, Loan, TinlakeLoan } from '@centrifuge/centrifuge-js'
import { StatusChip } from '@centrifuge/fabric'
import { daysBetween } from '../utils/date'

type LabelStatus = 'default' | 'info' | 'ok' | 'warning' | 'critical' | ''

interface Props {
  loan: Loan | TinlakeLoan
}

export function getLoanLabelStatus(l: Loan | TinlakeLoan): [LabelStatus, string] {
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  if (!l.status) return ['', '']
  if (l.status === 'Active' && (l as ActiveLoan).writeOffStatus) return ['critical', 'Write-off']

  const isExternalAssetRepaid =
    l.status === 'Active' && 'outstandingQuantity' in l.pricing && 'presentValue' in l && l.presentValue.isZero()
  if (l.status === 'Closed' || isExternalAssetRepaid) return ['ok', 'Repaid']
  if (
    l.status === 'Active' &&
    'interestRate' in l.pricing &&
    l.pricing.interestRate?.gtn(0) &&
    l.totalBorrowed?.isZero()
  )
    return ['default', 'Ready']
  if (l.status === 'Created') return ['default', 'Created']

  if (l.status === 'Active' && l.pricing.maturityDate) {
    const isTinlakeLoan = 'riskGroup' in l
    if (isTinlakeLoan) return ['warning', 'Ongoing']

    const days = daysBetween(today, l.pricing.maturityDate)
    if (days === 0) return ['warning', 'Due today']
    if (days === 1) return ['warning', 'Due tomorrow']
    if (days > 1 && days <= 5) return ['warning', `Due in ${days} days`]
    if (days === -1) return ['critical', `Due ${Math.abs(days)} day ago`]
    if (days < -1) return ['critical', `Due ${Math.abs(days)} days ago`]
  }
  return ['warning', 'Ongoing']
}

export function LoanLabel({ loan }: Props) {
  const [status, text] = getLoanLabelStatus(loan)
  const isCashAsset = 'valuationMethod' in loan.pricing && loan.pricing?.valuationMethod === 'cash'
  if (!status || isCashAsset) return null
  return <StatusChip status={status}>{text}</StatusChip>
}
