import { getActions } from './action-type-generator';
import { PurchaseOrder } from '../common/models/dto/purchase-order';

const CREATE_PURCHASE_ORDER_BASE_TYPE = 'CREATE_PURCHASE_ORDER_ACTION';
const GET_PURCHASE_ORDER_BASE_TYPE = 'GET_PURCHASE_ORDER_ACTION';

export const createPurchaseOrderAction = getActions(CREATE_PURCHASE_ORDER_BASE_TYPE);
export const getPurchaseOrdersAction = getActions(GET_PURCHASE_ORDER_BASE_TYPE);

function action(type, payload = {}) {
  return { type, ...payload };
}

export const createPurchaseOrder = (purchaseOrder: PurchaseOrder) =>
  action(createPurchaseOrderAction.start, { purchaseOrder });
export const getPurchaseOrders = () => action(getPurchaseOrdersAction.start);
