import { createInvoiceActionTypes } from '../../actions/invoices';
import { httpRequestReducer } from '../http-request-reducer';
import { Invoice } from '../../common/models/dto/invoice';

export default httpRequestReducer<Invoice>(createInvoiceActionTypes);
