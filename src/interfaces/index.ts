import {
  InvoiceInvoiceData,
  InvoiceInvoiceResponse,
  PurchaseorderPurchaseOrderResponse,
} from '../../clients/centrifuge-node/generated-client';
import { Contact } from '../common/models/dto/contact';

export interface LabelValuePair {
  label: string;
  value: string;
}

export interface InvoiceData extends InvoiceInvoiceData {
  supplier?: Contact;
}

export interface InvoiceResponse extends InvoiceInvoiceResponse {
  data?: InvoiceData;
  ownerId?: string;
  _id?: string;
}

export interface PurchaseOrderResponse
  extends PurchaseorderPurchaseOrderResponse {
  ownerId?: string;
  _id?: string;
}
