import { all, fork } from 'redux-saga/effects';
import invoices from './invoices';
import users from './users';

export default function*() {
  yield all([
    fork(invoices.watchGetInvoicesPage),
    fork(invoices.watchCreateInvoice),
    fork(users.watchLoginPage),
  ]);
}
