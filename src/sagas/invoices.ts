import { call, put, fork, take } from 'redux-saga/effects';
import { goBack } from 'connected-react-router';
import { httpClient } from '../http-client';
import {
  GET_INVOICE_ACTION_TYPES,
  CREATE_INVOICE_ACTION_TYPES,
} from '../actions/invoices';
import { Invoice } from '../common/models/dto/invoice';

export function* getInvoices() {
  try {
    const response = yield call(httpClient.invoices.read);
    yield put({
      type: GET_INVOICE_ACTION_TYPES.success,
      payload: response.data,
    });
  } catch (e) {
    yield put({ type: GET_INVOICE_ACTION_TYPES.fail, payload: e });
  }
}

export function* createInvoice(invoice: Invoice) {
  try {
    const response = yield call(httpClient.invoices.create, invoice);
    yield put({
      type: CREATE_INVOICE_ACTION_TYPES.success,
      payload: response.data,
    });
  } catch (e) {
    yield put({ type: CREATE_INVOICE_ACTION_TYPES.fail, payload: e });
  }
}

export function* watchGetInvoicesPage() {
  while (true) {
    yield take(GET_INVOICE_ACTION_TYPES.start);
    yield fork(getInvoices);
  }
}

export function* watchCreateInvoice() {
  while (true) {
    const { invoice } = yield take(CREATE_INVOICE_ACTION_TYPES.start);
    yield fork(createInvoice, invoice);
    yield put(goBack());
  }
}

export default {
  watchGetInvoicesPage,
  watchCreateInvoice,
};
