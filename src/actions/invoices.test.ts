import {
  CREATE_INVOICE_ACTION_TYPES,
  createInvoice,
  GET_INVOICE_ACTION_TYPES,
  getInvoices,
} from './invoices';
import { Invoice } from '../common/models/dto/invoice';

const assertActionEmitted = (action, type, payload?) => {
  const actionResult = action();
  expect(actionResult).toEqual({ type, ...payload });
};

const testActions = arr => {
  arr.forEach(({ name, action, type, payload }) => {
    describe(name, () => {
      it('emits action', () => {
        assertActionEmitted(action, type, payload);
      });
    });
  });
};

const invoiceToCreate = new Invoice(1, 'mickey', 'goofy', 'created');

testActions([
  {
    name: 'getInvoices',
    action: getInvoices,
    type: GET_INVOICE_ACTION_TYPES.start,
  },
  {
    name: 'createInvoice',
    action: () => createInvoice(invoiceToCreate),
    type: CREATE_INVOICE_ACTION_TYPES.start,
    payload: { invoice: invoiceToCreate },
  },
]);
