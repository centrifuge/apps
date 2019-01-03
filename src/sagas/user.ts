import { call, fork, put, take, takeEvery } from 'redux-saga/effects';
import { httpClient } from '../http-client';
import { userLoginAction } from '../actions/users';
import { User } from '../common/models/dto/user';
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

export default {
  watchLoginPage: () => takeEvery(userLoginAction.start, watchLoginPage),
};
