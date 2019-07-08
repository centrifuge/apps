import { put, takeEvery } from 'redux-saga/effects';
import { NOTIFICATION_ALERT_CLOSE } from '../actions/notifications';

export function* onAlertClose(action) {
  const { payload } = action;
  //reload the invoice in order to display the created funding agreement
  yield put(payload);
}


export default {
  watchCloseAlert: () => takeEvery(NOTIFICATION_ALERT_CLOSE, onAlertClose),
};
