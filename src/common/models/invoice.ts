import { InvoiceInvoiceData } from '../../../clients/centrifuge-node';

export interface Invoice extends InvoiceInvoiceData {
  _id?: string;
  collaborators?: string[];
}
