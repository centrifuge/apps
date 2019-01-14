import { call, put, takeEvery } from 'redux-saga/effects';

import {
  createPurchaseOrder,
  default as defaultExports,
  getPurchaseOrders,
} from './purchase-orders';

import {
  createPurchaseOrderAction,
  getPurchaseOrdersAction,
} from '../actions/purchase-orders';

import { PurchaseOrder } from '../common/models/dto/purchase-order';
import { httpClient } from '../http-client';

const purchaseOrder: PurchaseOrder = {
  po_number: '1',
  order_name: 'mickey',
  recipient_name: 'goofy',
};

describe('watchGetPurchaseOrdersPage', () => {
  it('should call getPurchaseOrders', async function() {
    const onWatchGetPurchaseOrdersPage = await defaultExports.watchGetPurchaseOrdersPage();

    expect(onWatchGetPurchaseOrdersPage).toEqual(
      takeEvery(getPurchaseOrdersAction.start, getPurchaseOrders),
    );
  });
});

describe('watchCreatePurchaseOrder', () => {
  it('should call createPurchaseOrder and go back on success', function() {
    const onWatchCreatePurchaseOrder = defaultExports.watchCreatePurchaseOrder();

    expect(onWatchCreatePurchaseOrder).toEqual(
      takeEvery(createPurchaseOrderAction.start, createPurchaseOrder),
    );
  });
});

describe('getPurchaseOrders', () => {
  it('should call the http client on success', function() {
    const gen = getPurchaseOrders();

    const invocationResponse = gen.next().value;
    expect(invocationResponse).toEqual(call(httpClient.purchaseOrders.read));

    const successResponse = gen.next({ data: purchaseOrder }).value;
    expect(successResponse).toEqual(
      put({
        type: getPurchaseOrdersAction.success,
        payload: purchaseOrder,
      }),
    );
  });

  it('should set error on exception', function() {
    const gen = getPurchaseOrders();

    const invocationResponse = gen.next().value;
    expect(invocationResponse).toEqual(call(httpClient.purchaseOrders.read));

    const error = new Error('Oh, no, something broke!');
    const errorResponse = gen.throw && gen.throw(error).value;
    expect(errorResponse).toEqual(
      put({
        type: getPurchaseOrdersAction.fail,
        payload: error,
      }),
    );
  });
});

describe('createPurchaseOrder', () => {
  it('should call the http client on success', function() {
    const gen = createPurchaseOrder({ purchaseOrder: purchaseOrder });

    const invocationResponse = gen.next().value;
    expect(invocationResponse).toEqual(
      call(httpClient.purchaseOrders.create, purchaseOrder),
    );

    const successResponse = gen.next({ data: purchaseOrder }).value;
    expect(successResponse).toEqual(
      put({
        type: createPurchaseOrderAction.success,
        payload: purchaseOrder,
      }),
    );
  });

  it('should set error on exception', function() {
    const gen = createPurchaseOrder({ purchaseOrder: purchaseOrder });

    const invocationResponse = gen.next().value;
    expect(invocationResponse).toEqual(
      call(httpClient.purchaseOrders.create, purchaseOrder),
    );

    const error = new Error('Oh, no, something broke!');
    const errorResponse = gen.throw && gen.throw(error).value;
    expect(errorResponse).toEqual(
      put({
        type: createPurchaseOrderAction.fail,
        payload: error,
      }),
    );
  });
});
