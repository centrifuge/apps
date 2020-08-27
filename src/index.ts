import actions from './actions/index'
import Tinlake from './Tinlake'
const { Admin, Borrower, Lender, Analytics, Currency, Collateral, Governance, Proxy, Epoch } = actions

export const TinlakeWithActions = Epoch(Proxy(Borrower(Admin(Lender(Analytics(Currency(Collateral(Governance(Tinlake)))))))))
export default TinlakeWithActions

export * from './types/tinlake'
export * from './utils/baseToDisplay'
export * from './utils/bnToHex'
export * from './utils/displayToBase'
export * from './utils/feeToInterestRate'
export * from './utils/getLoanStatus'
export * from './utils/interestRateToFee'
