import auth from './auth';
import { combineReducers } from 'redux';
import { httpRequestReducer } from '../http-request-reducer';
import {
  userRegisterAction,
  getAllUsersAction,
  userInviteAction,
  updateUserAction,
} from '../../actions/users';
import { User } from '../../../common/models/user';

const register = httpRequestReducer(userRegisterAction);
const list = httpRequestReducer<User[]>(getAllUsersAction);
const invite = httpRequestReducer(userInviteAction);
const update = httpRequestReducer(updateUserAction);
// TODO this needs to be refactored. The store needs a user list for the invite functionality
export default combineReducers({ auth, register, list, invite, update });
