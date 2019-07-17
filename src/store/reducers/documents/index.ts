import { combineReducers } from 'redux';
import { httpRequestReducer } from '../http-request-reducer';
import { Document } from '../../../common/models/document';
import {
  createDocumentAction,
  getDocumentByIdAction,
  getDocumentsAction,
  updateDocumentAction,
} from '../../actions/documents';


const create = httpRequestReducer<Document>(createDocumentAction);
const get = httpRequestReducer<Document[]>(getDocumentsAction);
const getById = httpRequestReducer<Document>(getDocumentByIdAction);
const update = httpRequestReducer<Document>(updateDocumentAction);

export default combineReducers({ create, get, getById, update });
