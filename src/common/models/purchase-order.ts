import { PurchaseorderPurchaseOrderData } from '../../../clients/centrifuge-node/generated-client/index';

export interface PurchaseOrder extends PurchaseorderPurchaseOrderData {
  _id?: string;
  collaborators?: string[];
}
