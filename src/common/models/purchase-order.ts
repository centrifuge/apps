import { PurchaseorderData } from '../../../clients/centrifuge-node';

export interface PurchaseOrder extends PurchaseorderData {
  _id?: string;
  collaborators?: string[];
}
