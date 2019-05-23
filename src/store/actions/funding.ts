import { getActions } from './action-type-generator';
import { FundingRequest } from '../../common/models/funding-request';

const CREATE_FUNDING_BASE = 'CREATE_FUNDING_ACTION';

export const createFundingAction = getActions(CREATE_FUNDING_BASE);

function action(type, payload = {}) {
  return { type, ...payload };
}

export const createFunding = (fundingRequest: FundingRequest) =>
  action(createFundingAction.start, { fundingRequest });
export const resetCreateFunding = () =>
  action(createFundingAction.reset);
