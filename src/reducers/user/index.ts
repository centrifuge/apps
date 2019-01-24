import auth from './auth';
import { combineReducers } from 'redux';
import { httpRequestReducer } from '../http-request-reducer';
import { userRegisterAction } from '../../actions/users';

export const register = httpRequestReducer(userRegisterAction);

export default combineReducers({ auth, register });
