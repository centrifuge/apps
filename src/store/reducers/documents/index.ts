import { combineReducers } from 'redux';
import { httpRequestReducer } from '../http-request-reducer';
import { CoreapiDocumentResponse } from '../../../../clients/centrifuge-node';
import {
  createDocumentAction,
  getDocumentByIdAction,
  getDocumentsAction,
  updateDocumentAction,
} from '../../actions/documents';


const create = httpRequestReducer<CoreapiDocumentResponse>(createDocumentAction);
const get = httpRequestReducer<CoreapiDocumentResponse[]>(getDocumentsAction);
const getById = httpRequestReducer<CoreapiDocumentResponse>(getDocumentByIdAction);
const update = httpRequestReducer<CoreapiDocumentResponse>(updateDocumentAction);

export default combineReducers({ create, get, getById, update });
