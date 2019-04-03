import { combineReducers } from 'redux';
import {
  createPurchaseOrderAction,
  getPurchaseOrderByIdAction,
  getPurchaseOrdersAction, updatePurchaseOrderAction,
} from '../../actions/purchase-orders';
import { httpRequestReducer } from '../http-request-reducer';
import { PurchaseorderPurchaseOrderData } from '../../../../clients/centrifuge-node/generated-client';
import { PurchaseOrder } from '../../../common/models/purchase-order';

const create = httpRequestReducer<PurchaseOrder>(createPurchaseOrderAction);
const get = httpRequestReducer<PurchaseorderPurchaseOrderData>(getPurchaseOrdersAction);
const getById = httpRequestReducer<PurchaseorderPurchaseOrderData>(getPurchaseOrderByIdAction);
const update = httpRequestReducer<PurchaseorderPurchaseOrderData>(updatePurchaseOrderAction);

export default combineReducers({ create, get, getById, update });
