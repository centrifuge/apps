import { call, fork, put, take, takeEvery } from 'redux-saga/effects';
import { httpClient } from '../../http-client';
import {
  getAllUsersAction,
  updateUserAction,
  userInviteAction,
  userLoginAction,
  userRegisterAction,
} from '../actions/users';
import { User } from '../../common/models/user';
import routes from '../../routes';
import { push } from 'connected-react-router';
import { alertError } from '../actions/notifications';

export function* loginUser(user: User) {
  try {
    const response = yield call(httpClient.user.login, user);
    yield put({
      type: userLoginAction.success,
      payload: response.data,
    });
  } catch (e) {
    yield put({ type: userLoginAction.fail, payload: e });
  }
}

export function* watchLoginPage(action) {
  yield fork(loginUser, action.user);
  yield take(userLoginAction.success);
  yield put(push(routes.invoices.index));
}

export function* registerUser(action) {
  try {
    const user = action.user;
    const response = yield call(httpClient.user.register, user);
    yield put({
      type: userRegisterAction.success,
      payload: response.data,
    });
  } catch (e) {
    yield put({ type: userRegisterAction.fail, payload: e });
  }
}

export function* inviteUser(action) {
  try {
    const user = action.user;
    const response = yield call(httpClient.user.invite, user);
    yield put({
      type: userInviteAction.success,
      payload: response.data,
    });
    // reload the users
    yield put({
      type: getAllUsersAction.start,
    });
  } catch (e) {
    yield put({ type: userInviteAction.fail, payload: e });
    yield put(alertError(
      'Failed to invite user',
      e.message,
      { onConfirmAction: { type: userInviteAction.clearError } },
    ));
  }
}

export function* updateUser(action) {
  try {
    const user = action.user;
    const response = yield call(httpClient.user.update, user);
    yield put({
      type: updateUserAction.success,
      payload: response.data,
    });
    // reload the users
    yield put({
      type: getAllUsersAction.start,
    });
  } catch (e) {

    yield put(alertError(
      'Failed to update user',
      e.message,
      { onConfirmAction: { type: updateUserAction.clearError } },
    ));
    yield put({ type: updateUserAction.fail, payload: e });

  }
}

export function* getAllUsers() {
  try {
    const response = yield call(httpClient.user.list);
    yield put({
      type: getAllUsersAction.success,
      payload: response.data,
    });
  } catch (e) {
    yield put({ type: userRegisterAction.fail, payload: e });
  }
}

export default {
  watchGetAllUsers: () => takeEvery(getAllUsersAction.start, getAllUsers),
  watchLoginPage: () => takeEvery(userLoginAction.start, watchLoginPage),
  watchUserInvite: () => takeEvery(userInviteAction.start, inviteUser),
  watchUserRegister: () => takeEvery(userRegisterAction.start, registerUser),
  watchUserUpdate: () => takeEvery(updateUserAction.start, updateUser),
};
