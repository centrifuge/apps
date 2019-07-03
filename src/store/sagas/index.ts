import { all, fork } from 'redux-saga/effects';
import invoices from './invoices';
import users from './user';
import contacts from './contacts';
import funding from './funding';
import transferDetails from './transfer-details';
import notifications from './notifications';

export default function* () {
  yield all([
    fork(invoices.watchGetInvoicesPage),
    fork(invoices.watchGetInvoiceById),
    fork(invoices.watchCreateInvoice),
    fork(invoices.watchUpdateInvoice),
    fork(users.watchLoginPage),
    fork(users.watchUserRegister),
    fork(users.watchUserInvite),
    fork(users.watchGetAllUsers),
    fork(contacts.watchGetContactsPage),
    fork(contacts.watchCreateContact),
    fork(contacts.watchUpdateContact),
    fork(funding.watchCreateFunding),
    fork(funding.watchSignFunding),
    fork(transferDetails.watchCreateTransferDetails),
    fork(transferDetails.watchUpdateTransferDetails),
    fork(notifications.watchCloseAlert),
  ]);
}
