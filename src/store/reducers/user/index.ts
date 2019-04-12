import auth from './auth';
import { combineReducers } from 'redux';
import { httpRequestReducer } from '../http-request-reducer';
import { userRegisterAction } from '../../actions/users';

export const register = httpRequestReducer(userRegisterAction);
// TODO this needs to be refactored. The store needs a user list for the invite functionality
export default combineReducers({ auth, register });
