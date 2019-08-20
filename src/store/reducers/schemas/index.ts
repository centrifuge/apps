import { combineReducers } from 'redux';
import { httpRequestReducer } from '../http-request-reducer';
import {
  archiveSchemaAction,
  createSchemaAction,
  getSchemaAction,
  getSchemasListAction,
  updateSchemaAction,
} from '../../actions/schemas';
import { Schema } from '../../../common/models/schema';

const create = httpRequestReducer<Schema>(createSchemaAction);
const getList = httpRequestReducer<Schema[]>(getSchemasListAction);
const get = httpRequestReducer<Schema>(getSchemaAction);
const update = httpRequestReducer<Schema>(updateSchemaAction);
const archive = httpRequestReducer<Schema>(archiveSchemaAction);

export default combineReducers({ create, get, getList, update, archive });
