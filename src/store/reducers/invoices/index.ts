import { combineReducers } from 'redux';
import {
  createInvoiceAction,
  getInvoiceAction,
  getInvoiceByIdAction,
  updateInvoiceAction,
} from '../../actions/invoices';
import { httpRequestReducer } from '../http-request-reducer';
import { Invoice } from '../../../common/models/invoice';
import { InvInvoiceData } from '../../../../clients/centrifuge-node';

const get = httpRequestReducer<InvInvoiceData>(getInvoiceAction);
const create = httpRequestReducer<Invoice>(createInvoiceAction);
const getById = httpRequestReducer<InvInvoiceData>(getInvoiceByIdAction);
const update = httpRequestReducer<InvInvoiceData>(updateInvoiceAction);

export default combineReducers({ create, get, getById, update });
