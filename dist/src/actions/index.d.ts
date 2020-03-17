import Admin, { IAdminActions } from './admin';
import Borrower, { IBorrowerActions } from './borrower';
import Lender, { ILenderActions } from './lender';
import Currency, { ICurrencyActions } from './currency';
import Collateral from './collateral';
import Analytics, { IAnalyticsActions } from './analytics';
import Governance, { IGovernanceActions } from './governance';
declare const _default: {
    Admin: typeof Admin;
    Borrower: typeof Borrower;
    Lender: typeof Lender;
    Currency: typeof Currency;
    Collateral: typeof Collateral;
    Analytics: typeof Analytics;
    Governance: typeof Governance;
};
export default _default;
export declare type TinlakeActions = IAdminActions & IBorrowerActions & ILenderActions & ICurrencyActions & ILenderActions & IAnalyticsActions & IGovernanceActions;
