import { getActions } from './action-type-generator';
import { PurchaseOrder } from '../../common/models/purchase-order';

const CREATE_PURCHASE_ORDER_BASE_TYPE = 'CREATE_PURCHASE_ORDER_ACTION';
const UPDATE_PURCHASE_ORDER_BASE_TYPE = 'UPDATE_PURCHASE_ORDER_ACTION';
const GET_PURCHASE_ORDER_BY_ID_TYPE = 'GET_PURCHASE_ORDER_ACTION_BY_ID';
const GET_PURCHASE_ORDER_BASE_TYPE = 'GET_PURCHASE_ORDER_ACTION';

export const createPurchaseOrderAction = getActions(
  CREATE_PURCHASE_ORDER_BASE_TYPE,
);
export const updatePurchaseOrderAction = getActions(
  UPDATE_PURCHASE_ORDER_BASE_TYPE,
);
export const getPurchaseOrdersAction = getActions(GET_PURCHASE_ORDER_BASE_TYPE);
export const getPurchaseOrderByIdAction = getActions(
  GET_PURCHASE_ORDER_BY_ID_TYPE,
);

function action(type, payload = {}) {
  return { type, ...payload };
}

export const createPurchaseOrder = (purchaseOrder: PurchaseOrder) =>
  action(createPurchaseOrderAction.start, { purchaseOrder });
export const resetCreatePurchaseOrder = () =>
  action(createPurchaseOrderAction.reset);
export const updatePurchaseOrder = (purchaseOrder: PurchaseOrder) =>
  action(updatePurchaseOrderAction.start, { purchaseOrder });
export const resetUpdatePurchaseOrder = () =>
  action(createPurchaseOrderAction.reset);
export const getPurchaseOrders = () => action(getPurchaseOrdersAction.start);
export const resetGetPurchaseOrders = () =>
  action(createPurchaseOrderAction.reset);
export const getPurchaseOrderById = id =>
  action(getPurchaseOrderByIdAction.start, { id });
export const resetGetPurchaseOrderById = () =>
  action(createPurchaseOrderAction.reset);
