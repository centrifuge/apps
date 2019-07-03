import { getActions } from './action-type-generator';
import { FundingRequest } from '../../common/models/funding-request';
import { FunRequest } from '../../../clients/centrifuge-node';
import { TransferDetailsRequest } from '../../common/models/transfer-details';

const CREATE_FUNDING_BASE = 'CREATE_FUNDING_ACTION';
const SIGN_FUNDING_BASE = 'SIGN_FUNDING_ACTION';
const SETTLE_FUNDING_BASE = 'SETTLE_FUNDING_ACTION';

export const createFundingAction = getActions(CREATE_FUNDING_BASE);
export const signFundingAction = getActions(SIGN_FUNDING_BASE);
export const settleFundingAction = getActions(SETTLE_FUNDING_BASE);

function action(type, payload = {}) {
  return { type, ...payload };
}

export const createFunding = (payload: FundingRequest) =>
  action(createFundingAction.start, { payload });
export const resetCreateFunding = () =>
  action(createFundingAction.reset);
export const clearCreateFundingError = () =>
  action(createFundingAction.clearError);


export const signFunding = (payload: FunRequest & { invoice_id: string }) =>
  action(signFundingAction.start, { payload });
export const resetSignFunding = () =>
  action(signFundingAction.reset);
export const clearSignFundingError = () =>
  action(signFundingAction.clearError);


export const settleFunding = (payload: TransferDetailsRequest) =>
  action(settleFundingAction.start, { payload });
export const resetSettleFunding = () =>
  action(settleFundingAction.reset);
export const clearSettleFundingError = () =>
  action(settleFundingAction.clearError);
