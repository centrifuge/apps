import { call, put, fork, take } from 'redux-saga/effects';
import { push } from 'connected-react-router';
import { httpClient } from '../http-client';
import {
  getInvoiceActionTypes,
  createInvoiceActionTypes,
} from '../actions/invoices';
import { Invoice } from '../common/models/dto/invoice';
import routes from '../invoices/routes';

export function* getInvoices() {
  try {
    const response = yield call(httpClient.invoices.read);
    yield put({
      type: getInvoiceActionTypes.success,
      payload: response.data,
    });
  } catch (e) {
    yield put({ type: getInvoiceActionTypes.fail, payload: e });
  }
}

export function* createInvoice(invoice: Invoice) {
  try {
    const response = yield call(httpClient.invoices.create, invoice);
    yield put({
      type: createInvoiceActionTypes.success,
      payload: response.data,
    });
  } catch (e) {
    yield put({ type: createInvoiceActionTypes.fail, payload: e });
  }
}

export function* watchGetInvoicesPage() {
  while (true) {
    yield take(getInvoiceActionTypes.start);
    yield fork(getInvoices);
  }
}

export function* watchCreateInvoice() {
  while (true) {
    const { invoice } = yield take(createInvoiceActionTypes.start);
    yield fork(createInvoice, invoice);
    yield put(push(routes.index));
  }
}

export default {
  watchGetInvoicesPage,
  watchCreateInvoice,
};
