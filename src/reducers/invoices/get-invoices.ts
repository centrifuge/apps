import { getInvoiceActionTypes } from '../../actions/invoices';
import { Invoice } from '../../common/models/dto/invoice';
import { httpRequestReducer } from '../http-request-reducer';

export default httpRequestReducer<Invoice[]>(getInvoiceActionTypes);
