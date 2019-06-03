import { call, put, takeEvery } from 'redux-saga/effects';
import { httpClient } from '../../http-client';
import { createFundingAction, signFundingAction } from '../actions/funding';
import { getInvoiceById } from '../actions/invoices';


export function* createFunding(action) {
  try {
    const { payload } = action;
    const response = yield call(httpClient.funding.create, payload);
    //reload the invoice in order to display the created funding agreement
    yield put(getInvoiceById(payload.invoice_id));
    yield put({
      type: createFundingAction.success,
      payload: response.data,
    });

  } catch (e) {
    yield put({ type: createFundingAction.fail, payload: e });
  }
}

export function* signFunding(action) {
  try {
    const { payload } = action;
    const response = yield call(httpClient.funding.sign, payload);
    //reload the invoice in order to display the created funding agreement
    yield put(getInvoiceById(payload.invoice_id));
    yield put({
      type: signFundingAction.success,
      payload: response.data,
    });

  } catch (e) {
    yield put({ type: createFundingAction.fail, payload: e });
  }
}


export default {
  watchCreateFunding: () => takeEvery(createFundingAction.start, createFunding),
  watchSignFunding: () => takeEvery(signFundingAction.start, signFunding),
};
