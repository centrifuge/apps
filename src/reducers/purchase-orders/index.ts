import { combineReducers } from 'redux';
import { createPurchaseOrderAction, getPurchaseOrdersAction } from '../../actions/purchase-orders';
import { httpRequestReducer } from '../http-request-reducer';
import { PurchaseorderPurchaseOrderData } from '../../../clients/centrifuge-node/generated-client';
import { PurchaseOrder } from '../../common/models/dto/purchase-order';

const create = httpRequestReducer<PurchaseOrder>(createPurchaseOrderAction);
const get = httpRequestReducer<PurchaseorderPurchaseOrderData>(getPurchaseOrdersAction);

export default combineReducers({ create, get });
