import { getInvoiceActionTypes } from '../../actions/invoices';
import { httpRequestReducer } from '../http-request-reducer';
import { InvoiceInvoiceData } from '../../../clients/centrifuge-node/generated-client';

export default httpRequestReducer<InvoiceInvoiceData[]>(getInvoiceActionTypes);
