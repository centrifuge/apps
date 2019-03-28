import {
  createInvoiceAction,
  createInvoice,
  getInvoiceAction,
  getInvoices,
} from './invoices';
import { Invoice } from '../common/models/invoice';

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

const invoiceToCreate: Invoice = {
  invoice_number: "1",
  sender_name: 'mickey',
  recipient_name: 'goofy'
};

testActions([
  {
    name: 'getInvoices',
    action: getInvoices,
    type: getInvoiceAction.start,
  },
  {
    name: 'createInvoice',
    action: () => createInvoice(invoiceToCreate),
    type: createInvoiceAction.start,
    payload: { invoice: invoiceToCreate },
  },
]);
