import { getActions } from './action-type-generator';
import { User } from '../common/models/dto/user';

const USER_LOGIN_BASE_TYPE = 'USER_LOGIN_ACTION';

export const userLoginActionTypes = getActions(USER_LOGIN_BASE_TYPE);

function action(type, payload = {}) {
  return { type, ...payload };
}

export const login = (user: User) =>
  action(userLoginActionTypes.start, { user });
