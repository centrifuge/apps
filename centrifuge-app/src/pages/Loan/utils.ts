import { CurrencyBalance, ExternalLoan, Loan } from '@centrifuge/centrifuge-js'
import { LoanTemplateAttribute } from '../../types'
import { formatDate } from '../../utils/date'
import { formatBalance } from '../../utils/formatting'

export function formatNftAttribute(value: any, attr: LoanTemplateAttribute) {
  switch (attr.input.type) {
    case 'number':
      return `${(attr.input.decimals
        ? new CurrencyBalance(value, attr.input.decimals).toFloat()
        : Number(value)
      ).toLocaleString('en')} ${attr.input.unit || ''}`
    case 'currency':
      return formatBalance(
        attr.input.decimals ? new CurrencyBalance(value, attr.input.decimals) : Number(value),
        attr.input.symbol
      )
    case 'date':
      return value ? formatDate(value) : ''
    default:
      return value
  }
}

export function isExternalLoan(loan: Loan): loan is ExternalLoan {
  return 'valuationMethod' in loan.pricing && loan.pricing.valuationMethod === 'oracle'
}
