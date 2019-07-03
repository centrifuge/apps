import { getActions } from './action-type-generator';
import { TransferDetailsRequest } from '../../common/models/transfer-details';

const CREATE_TRANSFER_DETAILS_BASE = 'CREATE_TRANSFER_DETAILS_ACTION';
const UODATE_TRANSFER_DETAILS_BASE = 'UPDATE_TRANSFER_DETAILS_ACTION';

export const createTransferDetailsAction = getActions(CREATE_TRANSFER_DETAILS_BASE);
export const updateTransferDetailsAction = getActions(UODATE_TRANSFER_DETAILS_BASE);

function action(type, payload = {}) {
  return { type, ...payload };
}

export const createTransferDetails = (payload: TransferDetailsRequest) =>
  action(createTransferDetailsAction.start, { payload });
export const resetCreateTransferDetails = () =>
  action(createTransferDetailsAction.reset);
export const clearCreateTransferDetailsError = () =>
  action(createTransferDetailsAction.clearError);


export const updateTransferDetails = (payload: TransferDetailsRequest) =>
  action(updateTransferDetailsAction.start, { payload });
export const resetUpdateTransferDetails = () =>
  action(updateTransferDetailsAction.reset);
export const clearUpdateTransferDetailsError = () =>
  action(updateTransferDetailsAction.clearError);
