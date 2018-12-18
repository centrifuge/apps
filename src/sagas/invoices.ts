import { call, put, takeEvery } from 'redux-saga/effects';
import { push } from 'connected-react-router';
import { httpClient } from '../http-client';
import { createInvoiceAction, getInvoiceAction } from '../actions/invoices';
import routes from '../invoices/routes';

export function* getInvoices() {
  try {
    const response = yield call(httpClient.invoices.read);
    yield put({
      type: getInvoiceAction.success,
      payload: response.data,
    });
  } catch (e) {
    yield put({ type: getInvoiceAction.fail, payload: e });
  }
}

export function* createInvoice(action) {
  try {
    const { invoice } = action;
    const response = yield call(httpClient.invoices.create, invoice);
    yield put({
      type: createInvoiceAction.success,
      payload: response.data,
    });
    yield put(push(routes.index));
  } catch (e) {
    yield put({ type: createInvoiceAction.fail, payload: e });
  }
}

export default {
  watchGetInvoicesPage: () => takeEvery(getInvoiceAction.start, getInvoices),
  watchCreateInvoice: () => takeEvery(createInvoiceAction.start, createInvoice),
};
