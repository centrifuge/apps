import {
  createPurchaseOrderAction,
  createPurchaseOrder,
  getPurchaseOrdersAction,
  getPurchaseOrders,
} from './purchase-orders';
import { PurchaseOrder } from '../common/models/purchase-order';

const assertActionEmitted = (action, type, payload?) => {
  const actionResult = action();
  expect(actionResult).toEqual({ type, ...payload });
};

const testActions = arr => {
  arr.forEach(({ name, action, type, payload }) => {
    describe(name, () => {
      it('emits action', () => {
        assertActionEmitted(action, type, payload);
      });
    });
  });
};

const purchaseOrderToCreate: PurchaseOrder = {
  po_number: "1",
  order_name: 'mickey',
  recipient_name: 'goofy'
};

testActions([
  {
    name: 'getPurchaseOrders',
    action: getPurchaseOrders,
    type: getPurchaseOrdersAction.start,
  },
  {
    name: 'createPurchaseOrder',
    action: () => createPurchaseOrder(purchaseOrderToCreate),
    type: createPurchaseOrderAction.start,
    payload: { purchaseOrder: purchaseOrderToCreate },
  },
]);
