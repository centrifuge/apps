import { InvoiceInvoiceData } from '../../clients/centrifuge-node/generated-client';
import { Contact } from '../common/models/dto/contact';

export interface LabelValuePair {
  label: string;
  value: string;
}

export interface InvoiceData extends InvoiceInvoiceData {
  supplier?: Contact;
  _id: string;
}
