import { all, fork } from 'redux-saga/effects';
import invoices from './invoices';
import users from './user';
import contacts from './contacts';
import funding from './funding';
import transferDetails from './transfer-details';
import notifications from './notifications';
import schemas from "./schemas";
import documents from "./documents";

export default function* () {
  yield all([
    fork(invoices.watchGetInvoicesPage),
    fork(invoices.watchGetInvoiceById),
    fork(invoices.watchCreateInvoice),
    fork(invoices.watchUpdateInvoice),
    fork(users.watchLoginPage),
    fork(users.watchUserRegister),
    fork(users.watchUserInvite),
    fork(users.watchUserUpdate),
    fork(users.watchGetAllUsers),
    fork(contacts.watchGetContactsPage),
    fork(contacts.watchCreateContact),
    fork(contacts.watchUpdateContact),
    fork(funding.watchCreateFunding),
    fork(funding.watchSignFunding),
    fork(funding.watchSettleFunding),
    fork(transferDetails.watchCreateTransferDetails),
    fork(transferDetails.watchUpdateTransferDetails),
    fork(schemas.watchCreateSchema),
    fork(schemas.watchGetSchema),
    fork(schemas.watchGetSchemasList),
    fork(schemas.watchUpdateSchema),
    fork(documents.watchCreateDocument),
    fork(documents.watchGetDocumentById),
    fork(documents.watchGetDocuments),
    fork(documents.watchUpdateDocument),
    fork(documents.watchMintNftForDocument),
    fork(notifications.watchCloseAlert),
  ]);
}
