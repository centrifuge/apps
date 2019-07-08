import { getActions } from './action-type-generator';
import { User } from '../../common/models/user';

const USER_LOGIN_BASE_TYPE = 'USER_LOGIN_ACTION';
const USER_REGISTER_TYPE = 'USER_REGISTER_ACTION';
const GET_ALL_USERS_TYPE = 'GET_ALL_USERS_ACTION';
const INVITE_USER_TYPE = 'INVITE_USER_ACTION';

export const userLoginAction = getActions(USER_LOGIN_BASE_TYPE);
export const userRegisterAction = getActions(USER_REGISTER_TYPE);
export const getAllUsersAction = getActions(GET_ALL_USERS_TYPE);
export const userInviteAction = getActions(INVITE_USER_TYPE);

function action(type, payload = {}) {
  return { type, ...payload };
}

export const login = (user: User) =>
  action(userLoginAction.start, { user });

export const invite = (user: User) =>
  action(userInviteAction.start, {user});

export const clearInviteError = () => action(userInviteAction.clearError);

export const register = (user: User) =>
  action(userRegisterAction.start, { user });

export const getAllUsers = () => action(getAllUsersAction.start);

export const resetGetAllUsers = () => action(getAllUsersAction.reset);
