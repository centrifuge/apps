import { combineReducers } from 'redux';
import create from './create-invoice';
import get from './get-invoices';

export default combineReducers({ create, get });
