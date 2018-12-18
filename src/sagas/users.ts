import { call, fork, put, take, takeEvery } from 'redux-saga/effects';
import { httpClient } from '../http-client';
import { userLoginActionTypes } from '../actions/users';
import { User } from '../common/models/dto/user';
import routes from '../routes';
import { push } from 'connected-react-router';

export function* loginUser(user: User) {
  try {
    const response = yield call(httpClient.users.login, user);
    yield put({
      type: userLoginActionTypes.success,
      payload: response.data,
    });
  } catch (e) {
    yield put({ type: userLoginActionTypes.fail, payload: e });
  }
}

export function* watchLoginPage(action) {
  yield fork(loginUser, action.user);
  yield take(userLoginActionTypes.success);
  yield put(push(routes.invoices.index));
}

export default {
  watchLoginPage: () => takeEvery(userLoginActionTypes.start, watchLoginPage),
};
