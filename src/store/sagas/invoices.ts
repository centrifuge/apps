import { call, put, takeEvery } from 'redux-saga/effects';
import { push } from 'connected-react-router';
import { httpClient } from '../../http-client';
import { createInvoiceAction, getInvoiceAction, getInvoiceByIdAction, updateInvoiceAction } from '../actions/invoices';
import routes from '../../routes';
import { alertError } from '../actions/notifications';

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

export function* getInvoiceById(action) {
  try {
    const { id } = action;
    const response = yield call(httpClient.invoices.readById, id);
    yield put({
      type: getInvoiceByIdAction.success,
      payload: response.data,
    });
  } catch (e) {
    yield put({ type: getInvoiceByIdAction.fail, payload: e });
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
    yield put(push(routes.invoices.index));
  } catch (e) {
    yield put({ type: createInvoiceAction.fail, payload: e });
    yield put(alertError(
      'Failed to create invoice',
      e.message,
      { onConfirmAction: { type: createInvoiceAction.clearError } },
    ));
  }
}

export function* updateInvoice(action) {
  try {
    const { invoice } = action;
    const response = yield call(httpClient.invoices.update, invoice);
    yield put({
      type: updateInvoiceAction.success,
      payload: response.data,
    });
    yield put(push(routes.invoices.index));
  } catch (e) {
    yield put({ type: updateInvoiceAction.fail, payload: e });
    yield put(alertError(
      'Failed to update invoice',
      e.message,
      { onConfirmAction: { type: updateInvoiceAction.clearError } },
    ));

  }
}

export default {
  watchGetInvoicesPage: () => takeEvery(getInvoiceAction.start, getInvoices),
  watchGetInvoiceById: () =>
    takeEvery(getInvoiceByIdAction.start, getInvoiceById),
  watchCreateInvoice: () => takeEvery(createInvoiceAction.start, createInvoice),
  watchUpdateInvoice: () => takeEvery(updateInvoiceAction.start, updateInvoice),
};
