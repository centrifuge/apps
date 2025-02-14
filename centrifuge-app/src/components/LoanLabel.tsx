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

  if (!l.status) {
    return ['', '']
  }

  const status = l.status.toLowerCase()

  const isActive = status === 'active'
  const isCreated = status === 'created'
  const isClosed = status === 'closed'
  const hasMaturity = isActive && l.pricing.maturityDate
  const isTinlakeLoan = 'riskGroup' in l
  const isWriteOff = isActive && (l as ActiveLoan).writeOffStatus

  // Highest priority: Write-off condition
  if (isWriteOff) {
    return ['critical', 'Write-off']
  }

  // Check for repaid conditions
  const isExternalAssetRepaid =
    isActive && 'outstandingQuantity' in l.pricing && 'presentValue' in l && l.presentValue.isZero()
  if (isClosed || isExternalAssetRepaid) {
    return ['ok', 'Repaid']
  }

  // Active loan where interest exists and no amount has been borrowed
  if (isActive && 'interestRate' in l.pricing && l.pricing.interestRate?.gtn(0) && l.totalBorrowed?.isZero()) {
    return ['default', 'Ready']
  }

  // Newly created loans are simply ongoing
  if (isCreated) {
    return ['warning', 'Ongoing']
  }

  // For active loans with a maturity date
  if (hasMaturity) {
    // For Tinlake-specific loans, always mark as ongoing regardless of maturity
    if (isTinlakeLoan) {
      return ['warning', 'Ongoing']
    }

    const days = daysBetween(today, l.pricing.maturityDate!)
    if (days === 0) {
      return ['critical', 'Due today']
    }
    if (days === 1) {
      return ['warning', 'Due tomorrow']
    }
    if (days > 1 && days <= 5) {
      return ['warning', `Due in ${days} days`]
    }
    if (days < 0) {
      return ['critical', 'Overdue']
    }
  }

  // Default label when no specific condition is met
  return ['warning', 'Ongoing']
}

export function LoanLabel({ loan }: Props) {
  const [status, text] = getLoanLabelStatus(loan)
  const isCashAsset = 'valuationMethod' in loan.pricing && loan.pricing?.valuationMethod === 'cash'
  if (!status || isCashAsset) return '-'
  return <StatusChip status={status}>{text}</StatusChip>
}
