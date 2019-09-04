import { call, put, takeEvery } from 'redux-saga/effects';
import { httpClient } from '../../http-client';
import {
  archiveSchemaAction,
  createSchemaAction,
  getSchemaAction,
  getSchemasListAction,
  updateSchemaAction,
} from '../actions/schemas';
import { alertError } from '../actions/notifications';

export function* getSchema(action) {
  try {
    const { id } = action;
    const response = yield call(httpClient.schemas.readById, id);
    yield put({
      type: getSchemaAction.success,
      payload: response.data,
    });
  } catch (e) {
    yield put({ type: getSchemaAction.fail, payload: e });
  }
}

export function* getSchemasList(action) {
  try {
    const response = yield call(httpClient.schemas.read, action.query);
    yield put({
      type: getSchemasListAction.success,
      payload: response.data,
    });
  } catch (e) {
    yield put({ type: getSchemasListAction.fail, payload: e });
  }
}

export function* createSchema(action) {
  try {
    const response = yield call(httpClient.schemas.create, action.schema);
    yield put({
      type: createSchemaAction.success,
      payload: response.data,
    });
    yield put({
      type: getSchemasListAction.start,
    });
  } catch (e) {
    yield put({ type: createSchemaAction.fail, payload: e });
    yield put(alertError(
      'Failed to create schema',
      e.message,
      { onConfirmAction: { type: updateSchemaAction.clearError } },
    ));
  }
}

export function* updateSchema(action) {
  try {
    const response = yield call(httpClient.schemas.update, action.schema);
    yield put({
      type: updateSchemaAction.success,
      payload: response.data,
    });
    yield put({
      type: getSchemasListAction.start,
    });
  } catch (e) {
    yield put({ type: updateSchemaAction.fail, payload: e });
    yield put(alertError(
      'Failed to update schema',
      e.message,
      { onConfirmAction: { type: updateSchemaAction.clearError } },
    ));
  }
}

export function* archiveSchema(action) {
  try {
    const response = yield call(httpClient.schemas.archive, action.id);
    yield put({
      type: archiveSchemaAction.success,
      payload: response.data,
    });
    yield put({
      type: getSchemasListAction.start,
    });
  } catch (e) {
    yield put({ type: archiveSchemaAction.fail, payload: e });
    yield put(alertError(
      'Failed to archive schema',
      e.message,
      { onConfirmAction: { type: archiveSchemaAction.clearError } },
    ));
  }
}

export default {
  watchGetSchemasList: () => takeEvery(getSchemasListAction.start, getSchemasList),
  watchGetSchema: () => takeEvery(getSchemaAction.start, getSchema),
  watchCreateSchema: () => takeEvery(createSchemaAction.start, createSchema),
  watchUpdateSchema: () => takeEvery(updateSchemaAction.start, updateSchema),
  watchArchiveSchema: () => takeEvery(archiveSchemaAction.start, archiveSchema),
};

