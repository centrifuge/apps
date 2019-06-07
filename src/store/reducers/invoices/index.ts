import { combineReducers } from 'redux';
import {
  createInvoiceAction,
  getInvoiceAction,
  getInvoiceByIdAction,
  updateInvoiceAction,
} from '../../actions/invoices';
import { httpRequestReducer } from '../http-request-reducer';
import { InvoiceData } from '../../../common/interfaces';
import { Invoice } from '../../../common/models/invoice';

const get = httpRequestReducer<InvoiceData>(getInvoiceAction);
const create = httpRequestReducer<Invoice>(createInvoiceAction);
const getById = httpRequestReducer<InvoiceData>(getInvoiceByIdAction);
const update = httpRequestReducer<InvoiceData>(updateInvoiceAction);

export default combineReducers({ create, get, getById, update });
