import { call, put, takeEvery } from 'redux-saga/effects';
import { push } from 'connected-react-router';
import { httpClient } from '../../http-client';
import routes from '../../invoices/routes';
import { createFundingAction } from '../actions/funding';
import { getInvoiceById } from '../actions/invoices';


export function* createFunding(action) {
  try {
    const { fundingRequest } = action;
    const response = yield call(httpClient.funding.create, fundingRequest);
    //reload the invoice in order to display the created funding agreement
    yield put(getInvoiceById(fundingRequest.invoice_id));
    yield put({
      type: createFundingAction.success,
      payload: response.data,
    });

  } catch (e) {
    yield put({ type: createFundingAction.fail, payload: e });
  }
}


export default {
  watchCreateFunding: () => takeEvery(createFundingAction.start, createFunding),
};
