import { combineReducers } from 'redux';
import create from './create-contact';
import get from './get-contacts';

export default combineReducers({ create, get });
