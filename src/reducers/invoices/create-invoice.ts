import { CREATE_INVOICE_ACTION_TYPES } from '../../actions/invoices';
import { httpRequestReducer } from '../http-request-reducer';
import { Invoice } from '../../common/models/dto/invoice';

export default httpRequestReducer<Invoice>(CREATE_INVOICE_ACTION_TYPES);
