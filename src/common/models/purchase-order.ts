import { PoPurchaseOrderData } from '../../../clients/centrifuge-node';

export interface PurchaseOrder extends PoPurchaseOrderData {
  _id?: string;
  collaborators?: string[];
}
