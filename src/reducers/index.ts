import { combineReducers } from 'redux';
import { connectRouter } from 'connected-react-router';

import invoices from './invoices';

export default history =>
  combineReducers({ router: connectRouter(history), invoices });
