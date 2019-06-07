import { combineReducers } from 'redux';

import {
  getContactsAction,
  createContactAction,
  updateContactAction,
} from '../../actions/contacts';
import { httpRequestReducer } from '../http-request-reducer';
import { Contact } from '../../../common/models/contact';

const create = httpRequestReducer<Contact>(createContactAction);

const get = httpRequestReducer<Contact[]>(getContactsAction);
const update = httpRequestReducer<Contact>(updateContactAction);

export default combineReducers({ create, get, update });
