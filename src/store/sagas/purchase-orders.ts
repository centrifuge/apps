import { call, put, takeEvery } from 'redux-saga/effects';
import { push } from 'connected-react-router';
import { httpClient } from '../../http-client';
import {
  createPurchaseOrderAction,
  getPurchaseOrdersAction,
  getPurchaseOrderByIdAction,
  updatePurchaseOrderAction,
} from '../actions/purchase-orders';
import routes from '../../purchase-orders/routes';

export function* getPurchaseOrders() {
  try {
    const response = yield call(httpClient.purchaseOrders.read);
    yield put({
      type: getPurchaseOrdersAction.success,
      payload: response.data,
    });
  } catch (e) {
    yield put({ type: getPurchaseOrdersAction.fail, payload: e });
  }
}

export function* getPurchaseOrderById(action) {
  try {
    const { id } = action;
    const response = yield call(httpClient.purchaseOrders.readById, id);
    yield put({
      type: getPurchaseOrderByIdAction.success,
      payload: response.data,
    });
  } catch (e) {
    yield put({ type: getPurchaseOrderByIdAction.fail, payload: e });
  }
}

export function* createPurchaseOrder(action) {
  try {
    const { purchaseOrder } = action;
    const response = yield call(
      httpClient.purchaseOrders.create,
      purchaseOrder,
    );
    yield put({
      type: createPurchaseOrderAction.success,
      payload: response.data,
    });
    yield put(push(routes.index));
  } catch (e) {
    yield put({ type: createPurchaseOrderAction.fail, payload: e });
  }
}

export function* updatePurchaseOrder(action) {
  try {
    const { purchaseOrder } = action;
    const response = yield call(
      httpClient.purchaseOrders.update,
      purchaseOrder,
    );
    yield put({
      type: updatePurchaseOrderAction.success,
      payload: response.data,
    });
    yield put(push(routes.index));
  } catch (e) {
    yield put({ type: updatePurchaseOrderAction.fail, payload: e });
  }
}

export default {
  watchGetPurchaseOrdersPage: () =>
    takeEvery(getPurchaseOrdersAction.start, getPurchaseOrders),
  watchGetPurchaseOrderById: () =>
    takeEvery(getPurchaseOrderByIdAction.start, getPurchaseOrderById),
  watchCreatePurchaseOrder: () =>
    takeEvery(createPurchaseOrderAction.start, createPurchaseOrder),
  watchUpdatePurchaseOrder: () =>
    takeEvery(updatePurchaseOrderAction.start, updatePurchaseOrder),
};
