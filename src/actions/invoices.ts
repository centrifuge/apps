import { getActions } from './action-type-generator';
import { Invoice } from '../common/models/dto/invoice';

const CREATE_INVOICE_BASE_TYPE = 'CREATE_INVOICE_ACTION';
const GET_INVOICE_BASE_TYPE = 'GET_INVOICE_ACTION';

export const CREATE_INVOICE_ACTION_TYPES = getActions(CREATE_INVOICE_BASE_TYPE);
export const GET_INVOICE_ACTION_TYPES = getActions(GET_INVOICE_BASE_TYPE);

function action(type, payload = {}) {
  return { type, ...payload };
}

export const createInvoice = (invoice: Invoice) =>
  action(CREATE_INVOICE_ACTION_TYPES.start, { invoice });
export const getInvoices = () => action(GET_INVOICE_ACTION_TYPES.start);
