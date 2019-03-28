import { InvoiceInvoiceData } from '../../../clients/centrifuge-node/generated-client/index';

export interface Invoice extends InvoiceInvoiceData {
  _id?: string;
  collaborators?: string[];
}
