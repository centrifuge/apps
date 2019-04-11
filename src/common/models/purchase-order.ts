import { PurchaseorderPurchaseOrderData } from '../../../clients/centrifuge-node';

export interface PurchaseOrder extends PurchaseorderPurchaseOrderData {
  _id?: string;
  collaborators?: string[];
}
