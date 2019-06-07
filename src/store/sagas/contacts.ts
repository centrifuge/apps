import { call, put, takeEvery } from 'redux-saga/effects';
import { httpClient } from '../../http-client';
import {
  createContactAction,
  getContactsAction,
  updateContactAction,
} from '../actions/contacts';

export function* getContacts() {
  try {
    const response = yield call(httpClient.contacts.read);
    yield put({
      type: getContactsAction.success,
      payload: response.data,
    });
  } catch (e) {
    yield put({ type: getContactsAction.fail, payload: e });
  }
}

export function* createContact(action) {
  try {
    const { contact } = action;
    const response = yield call(httpClient.contacts.create, contact);
    yield put({
      type: createContactAction.success,
      payload: response.data,
    });
    yield put({
      type: getContactsAction.start,
    });
  } catch (e) {
    yield put({ type: createContactAction.fail, payload: e });
  }
}

export function* updateContact(action) {
  try {
    const { contact } = action;
    const response = yield call(httpClient.contacts.update, contact);
    yield put({
      type: updateContactAction.success,
      payload: response.data,
    });
    yield put({
      type: getContactsAction.start,
    });
  } catch (e) {
    yield put({ type: updateContactAction.fail, payload: e });
  }
}

export default {
  watchGetContactsPage: () => takeEvery(getContactsAction.start, getContacts),
  watchCreateContact: () => takeEvery(createContactAction.start, createContact),
  watchUpdateContact: () => takeEvery(updateContactAction.start, updateContact),
};
