import { combineReducers } from 'redux';
import { connectRouter } from 'connected-react-router';

import invoices from './invoices';
import user from './user';
import contacts from './contacts';
import funding from './funding';

export default history =>
  combineReducers({
    router: connectRouter(history),
    invoices,
    user,
    contacts,
    funding,
  });
