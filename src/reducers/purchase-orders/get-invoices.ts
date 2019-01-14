import { getInvoiceAction } from '../../actions/invoices';
import { httpRequestReducer } from '../http-request-reducer';
import { InvoiceData } from '../../interfaces';

export default httpRequestReducer<InvoiceData>(getInvoiceAction);
