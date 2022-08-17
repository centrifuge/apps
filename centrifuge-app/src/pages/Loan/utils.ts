import { Loan as LoanType, PoolMetadata, Rate } from '@centrifuge/centrifuge-js'

export const LOAN_FIELDS = {
  BulletLoan: ['advanceRate', 'probabilityOfDefault', 'lossGivenDefault', 'value', 'discountRate', 'maturityDate'],
  CreditLine: ['advanceRate', 'value'],
  CreditLineWithMaturity: [
    'advanceRate',
    'probabilityOfDefault',
    'lossGivenDefault',
    'value',
    'discountRate',
    'maturityDate',
  ],
}

export const LOAN_TYPE_LABELS = {
  BulletLoan: 'Bullet loan',
  CreditLine: 'Credit line',
  CreditLineWithMaturity: 'Credit line with maturity',
}

export function getMatchingRiskGroupIndex(loan: LoanType, riskGroups: PoolMetadata['riskGroups']) {
  if (loan.status === 'Created') {
    return -1
  }
  const loanInterestRatePerSec = loan.interestRatePerSec?.toApr().toFixed(4)
  const loanAdvanceRate = loan.loanInfo.advanceRate.toFloat().toFixed(4)
  const loanLossGivenDefault =
    'lossGivenDefault' in loan.loanInfo ? loan.loanInfo.lossGivenDefault.toFloat().toFixed(4) : null
  const loanProbabilityOfDefault =
    'probabilityOfDefault' in loan.loanInfo ? loan.loanInfo.probabilityOfDefault.toFloat().toFixed(4) : null
  const loanDiscountRate = 'discountRate' in loan.loanInfo ? loan.loanInfo.discountRate.toApr().toFixed(4) : null

  return riskGroups.findIndex(
    (g) =>
      loanInterestRatePerSec === new Rate(g.interestRatePerSec).toApr().toFixed(4) &&
      loanAdvanceRate === new Rate(g.advanceRate).toFloat().toFixed(4) &&
      (!loanDiscountRate || loanDiscountRate === new Rate(g.discountRate).toApr().toFixed(4)) &&
      (!loanProbabilityOfDefault ||
        loanProbabilityOfDefault === new Rate(g.probabilityOfDefault).toFloat().toFixed(4)) &&
      (!loanLossGivenDefault || loanLossGivenDefault === new Rate(g.lossGivenDefault).toFloat().toFixed(4))
  )
}
