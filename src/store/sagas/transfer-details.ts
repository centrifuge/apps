import { call, put, takeEvery } from 'redux-saga/effects';
import { httpClient } from '../../http-client';
import { getInvoiceById } from '../actions/invoices';
import { alertError } from '../actions/notifications';
import { createTransferDetailsAction, updateTransferDetailsAction } from '../actions/transfer-details';


export function* createTransferDetails(action) {
  try {
    const { payload } = action;
    yield timeout(1000);
    const response = yield call(httpClient.transferDetails.create, payload);
    //reload the invoice in order to display the created funding agreement
    yield put(getInvoiceById(payload.invoice_id));
    yield put({
      type: createTransferDetailsAction.success,
      payload: response.data,
    });

  } catch (e) {
    yield put({ type: createTransferDetailsAction.fail, payload: e });
    yield put(alertError(
      'Failed to record transfer detail',
      e.message,
      { onConfirmAction: { type: createTransferDetailsAction.clearError } },
    ));
  }
}

export function* updateTransferDetails(action) {
  try {
    const { payload } = action;

    yield timeout(1000);
    const response = yield call(httpClient.transferDetails.update, payload);
    //reload the invoice in order to display the created funding agreement
    yield put(getInvoiceById(payload.invoice_id));
    yield put({
      type: updateTransferDetailsAction.success,
      payload: response.data,
    });

  } catch (e) {
    yield put({ type: updateTransferDetailsAction.fail, payload: e });
    yield put(alertError(
      'Failed to update transfer details',
      e.message,
      { onConfirmAction: { type: updateTransferDetailsAction.clearError } },
    ));

  }
}


export default {
  watchCreateTransferDetails: () => takeEvery(createTransferDetailsAction.start, createTransferDetails),
  watchUpdateTransferDetails: () => takeEvery(updateTransferDetailsAction.start, updateTransferDetails),
};


function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
