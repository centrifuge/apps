import { call, fork, put, take, takeEvery } from 'redux-saga/effects';
import { httpClient } from '../http-client';
import { userLoginAction, userRegisterAction } from '../actions/users';
import { User } from '../common/models/user';
import routes from '../routes';
import { push } from 'connected-react-router';

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

export default {
  watchLoginPage: () => takeEvery(userLoginAction.start, watchLoginPage),
  watchUserRegister: () => takeEvery(userRegisterAction.start, registerUser),
};
