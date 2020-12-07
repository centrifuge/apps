import Admin, { IAdminActions } from './admin'
import Analytics, { IAnalyticsActions } from './analytics'
import Borrower, { IBorrowerActions } from './borrower'
import Collateral, { ICollateralActions } from './collateral'
import Coordinator, { ICoordinatorActions } from './coordinator'
import Currency, { ICurrencyActions } from './currency'
import Governance, { IGovernanceActions } from './governance'
import Lender, { ILenderActions } from './lender'
import Proxy, { IProxyActions } from './proxy'

export default {
  Admin,
  Borrower,
  Lender,
  Currency,
  Collateral,
  Analytics,
  Governance,
  Proxy,
  Coordinator,
}

export type TinlakeActions = IAdminActions &
  IBorrowerActions &
  ICurrencyActions &
  ILenderActions &
  IAnalyticsActions &
  ICollateralActions &
  IGovernanceActions &
  IProxyActions &
  ICoordinatorActions
