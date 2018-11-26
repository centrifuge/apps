import { all, fork } from 'redux-saga/effects';
import invoices from './invoices';

export default function*() {
  yield all([
    fork(invoices.watchGetInvoicesPage),
    fork(invoices.watchCreateInvoice),
  ]);
}
