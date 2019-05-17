import {
  InvInvoiceData,
  InvInvoiceResponse,
  PoPurchaseOrderResponse,
} from '../../clients/centrifuge-node';
import { Contact } from './models/contact';

//TODO break all interfaces up and move to models
//TODO Refactor this. The name is bad. Is it very interface specic ? Do we need an interface for this?
export interface LabelValuePair {
  label: string;
  value: string;
}

export interface InvoiceData extends InvInvoiceData {
  supplier?: Contact;
}

export interface InvoiceResponse extends InvInvoiceResponse {
  data?: InvoiceData;
  ownerId?: string;
  _id?: string;
}

export interface PurchaseOrderResponse
  extends PoPurchaseOrderResponse {
  ownerId?: string;
  _id?: string;
}
