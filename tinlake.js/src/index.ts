import actions from './actions/index'
import Tinlake from './Tinlake'
const { Admin, Borrower, ClaimCFG, Lender, Analytics, Currency, Collateral, Governance, Proxy, Coordinator } = actions

export const TinlakeWithActions = Coordinator(
  ClaimCFG(Proxy(Borrower(Admin(Lender(Analytics(Currency(Collateral(Governance(Tinlake)))))))))
)
export default TinlakeWithActions

export * from './types/tinlake'
export * from './utils/addThousandsSeparators'
export * from './utils/baseToDisplay'
export * from './utils/bnToHex'
export * from './utils/displayToBase'
export * from './utils/feeToInterestRate'
export * from './utils/getLoanStatus'
export * from './utils/interestRateToFee'
export * from './utils/toPrecision'
