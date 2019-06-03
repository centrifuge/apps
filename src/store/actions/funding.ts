import { getActions } from './action-type-generator';
import { FundingRequest } from '../../common/models/funding-request';
import { FunRequest } from '../../../clients/centrifuge-node';

const CREATE_FUNDING_BASE = 'CREATE_FUNDING_ACTION';
const SIGN_FUNDING_BASE = 'SIGN_FUNDING_ACTION';

export const createFundingAction = getActions(CREATE_FUNDING_BASE);
export const signFundingAction = getActions(SIGN_FUNDING_BASE);

function action(type, payload = {}) {
  return { type, ...payload };
}

export const createFunding = (payload: FundingRequest) =>
  action(createFundingAction.start, { payload });
export const resetCreateFunding = () =>
  action(createFundingAction.reset);


export const signFunding = (payload: FunRequest & { invoice_id: string }) =>
  action(signFundingAction.start, { payload });
export const resetSignFunding = () =>
  action(signFundingAction.reset);
