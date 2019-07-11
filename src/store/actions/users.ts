import { getActions } from './action-type-generator';
import { User } from '../../common/models/user';

const USER_LOGIN_ACTION = 'USER_LOGIN_ACTION';
const USER_REGISTER_ACTION = 'USER_REGISTER_ACTION';
const GET_ALL_USERS_ACTION = 'GET_ALL_USERS_ACTION';
const INVITE_USER_ACTION = 'INVITE_USER_ACTION';
const UPDATE_USER_ACTION = 'UPDATE_USER_ACTION';

export const userLoginAction = getActions(USER_LOGIN_ACTION);
export const userRegisterAction = getActions(USER_REGISTER_ACTION);
export const getAllUsersAction = getActions(GET_ALL_USERS_ACTION);
export const userInviteAction = getActions(INVITE_USER_ACTION);
export const updateUserAction = getActions(UPDATE_USER_ACTION);

function action(type, payload = {}) {
  return { type, ...payload };
}

export const login = (user: User) =>
  action(userLoginAction.start, { user });

export const invite = (user: User) =>
  action(userInviteAction.start, {user});
export const clearInviteError = () => action(userInviteAction.clearError);

export const updateUser = (user: User) =>
  action(updateUserAction.start, {user});

export const clearUpdateError = () => action(updateUserAction.clearError);

export const register = (user: User) =>
  action(userRegisterAction.start, { user });

export const getAllUsers = () => action(getAllUsersAction.start);

export const resetGetAllUsers = () => action(getAllUsersAction.reset);
