import { call, put, takeEvery } from 'redux-saga/effects';
import { httpClient } from '../../http-client';
import {
  createSchemaAction,
  getSchemaAction,
  getSchemasListAction,
  updateSchemaAction
} from "../actions/schemas";

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

export function* getSchemasList() {
  try {
    const response = yield call(httpClient.schemas.read);
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
      type:getSchemasListAction.start,
    });
  } catch (e) {
    yield put({ type: updateSchemaAction.fail, payload: e });
  }
}

export default {
  watchGetSchemasList: () => takeEvery(getSchemasListAction.start, getSchemasList),
  watchGetSchema: () => takeEvery(getSchemaAction.start, getSchema),
  watchCreateSchema: () => takeEvery(createSchemaAction.start, createSchema),
  watchUpdateSchema: () => takeEvery(updateSchemaAction.start, updateSchema),
}