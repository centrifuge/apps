import {
  createInvoiceAction,
  createInvoice,
  getInvoiceAction,
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
    type: getInvoiceAction.start,
  },
  {
    name: 'createInvoice',
    action: () => createInvoice(invoiceToCreate),
    type: createInvoiceAction.start,
    payload: { invoice: invoiceToCreate },
  },
]);
