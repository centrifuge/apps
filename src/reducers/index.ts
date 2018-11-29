import { combineReducers } from 'redux';
import { connectRouter } from 'connected-react-router';

import invoices from './invoices';
import users from './users';

export default history =>
  combineReducers({ router: connectRouter(history), invoices, users });
