import { combineReducers } from 'redux';
import { connectRouter } from 'connected-react-router';

import invoices from './invoices';
import users from './users';
import contacts from './contacts';

export default history =>
  combineReducers({
    router: connectRouter(history),
    invoices,
    users,
    contacts,
  });
