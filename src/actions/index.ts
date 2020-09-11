import Admin, { IAdminActions } from './admin'
import Borrower, { IBorrowerActions } from './borrower'
import Lender, { ILenderActions } from './lender'
import Currency, { ICurrencyActions } from './currency'
import Collateral, { ICollateralActions } from './collateral'
import Analytics, { IAnalyticsActions } from './analytics'
import Governance, { IGovernanceActions } from './governance'
import Proxy, { IProxyActions } from './proxy'
import Coordinator, { ICoordinatorActions } from './coordinator'

export default {
  Admin,
  Borrower,
  Lender,
  Currency,
  Collateral,
  Analytics,
  Governance,
  Proxy,
  Coordinator
}

export type TinlakeActions = IAdminActions &
  IBorrowerActions &
  ILenderActions &
  ICurrencyActions &
  ILenderActions &
  IAnalyticsActions &
  ICollateralActions &
  IGovernanceActions &
  IProxyActions &
  ICoordinatorActions
