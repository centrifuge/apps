import { getActions } from './action-type-generator';
import { Contact } from '../common/models/contact';

const CREATE_CONTACT_BASE_TYPE = 'CREATE_CONTACT_ACTION';
const GET_CONTACTS_BASE_TYPE = 'GET_CONTACTS_ACTION';
const UPDATE_CONTACTS_BASE_TYPE = 'UPDATE_CONTACTS_ACTION';

export const createContactAction = getActions(CREATE_CONTACT_BASE_TYPE);
export const getContactsAction = getActions(GET_CONTACTS_BASE_TYPE);
export const updateContactAction = getActions(UPDATE_CONTACTS_BASE_TYPE);

function action(type, payload = {}) {
  return { type, ...payload };
}

export const createContact = (contact: Contact) =>
  action(createContactAction.start, { contact });
export const resetCreateContact = () => action(createContactAction.reset);
export const getContacts = () => action(getContactsAction.start);
export const resetGetContacts = () => action(getContactsAction.reset);
export const updateContact = (contact: Contact) =>
  action(updateContactAction.start, { contact: contact });
export const resetUpdateContact = () => action(updateContactAction.reset);
