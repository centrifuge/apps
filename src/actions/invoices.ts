import { getActions } from './action-type-generator';
import { Invoice } from '../common/models/invoice';

const CREATE_INVOICE_BASE_TYPE = 'CREATE_INVOICE_ACTION';
const UPDATE_INVOICE_BASE_TYPE = 'UPDATE_INVOICE_ACTION';
const GET_INVOICE_BASE_TYPE = 'GET_INVOICE_ACTION';
const GET_INVOICE_BY_ID = 'GET_INVOICE_BY_ID_ACTION';

export const createInvoiceAction = getActions(CREATE_INVOICE_BASE_TYPE);
export const updateInvoiceAction = getActions(UPDATE_INVOICE_BASE_TYPE);
export const getInvoiceAction = getActions(GET_INVOICE_BASE_TYPE);
export const getInvoiceByIdAction = getActions(GET_INVOICE_BY_ID);

function action(type, payload = {}) {
  return { type, ...payload };
}

export const createInvoice = (invoice: Invoice) =>
  action(createInvoiceAction.start, { invoice });
export const resetCreateInvoice = () => action(createInvoiceAction.reset);
export const updateInvoice = (invoice: Invoice) =>
  action(updateInvoiceAction.start, { invoice });
export const resetUpdateInvoice = () => action(updateInvoiceAction.reset);
export const getInvoices = () => action(getInvoiceAction.start);
export const resetGetInvoices = () => action(getInvoiceAction.reset);
export const getInvoiceById = id => action(getInvoiceByIdAction.start, { id });
export const resetGetInvoiceById = () => action(getInvoiceByIdAction.reset);
