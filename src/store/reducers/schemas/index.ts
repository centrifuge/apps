import { combineReducers } from 'redux';
import { httpRequestReducer } from '../http-request-reducer';
import {
  createSchemaAction,
  getSchemaAction,
  getSchemasListAction,
  updateSchemaAction
} from "../../actions/schemas";
import { Schema } from "../../../common/models/schema";

const create = httpRequestReducer<Schema>(createSchemaAction);
const getList = httpRequestReducer<Schema[]>(getSchemasListAction);
const get = httpRequestReducer<Schema>(getSchemaAction);
const update = httpRequestReducer<Schema>(updateSchemaAction);

export default combineReducers({ create, get, getList, update });