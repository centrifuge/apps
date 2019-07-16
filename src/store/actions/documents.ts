import { getActions } from './action-type-generator';
import { CoreapiDocumentResponse } from '../../../clients/centrifuge-node';

const CREATE_DOCUMENT_BASE_TYPE = 'CREATE_DOCUMENT_ACTION';
const UPDATE_DOCUMENT_BASE_TYPE = 'UPDATE_DOCUMENT_ACTION';
const GET_DOCUMENT_BASE_TYPE = 'GET_DOCUMENT_ACTION';
const GET_DOCUMENT_BY_ID = 'GET_DOCUMENT_BY_ID_ACTION';

export const createDocumentAction = getActions(CREATE_DOCUMENT_BASE_TYPE);
export const updateDocumentAction = getActions(UPDATE_DOCUMENT_BASE_TYPE);
export const getDocumentsAction = getActions(GET_DOCUMENT_BASE_TYPE);
export const getDocumentByIdAction = getActions(GET_DOCUMENT_BY_ID);

function action(type, payload = {}) {
  return { type, ...payload };
}

export const createDocument = (document: CoreapiDocumentResponse) =>
  action(createDocumentAction.start, { document });
export const clearCreateDocumentError = () => action(createDocumentAction.clearError);
export const resetCreateDocument = () => action(createDocumentAction.reset);

export const updateDocument = (document: CoreapiDocumentResponse) =>
  action(updateDocumentAction.start, { document });
export const clearUpdateDocumentError = () => action(updateDocumentAction.clearError);
export const resetUpdateDocument = () => action(updateDocumentAction.reset);

export const getDocuments = () => action(getDocumentsAction.start);
export const resetGetDocuments = () => action(getDocumentsAction.reset);

export const getDocumentById = id => action(getDocumentByIdAction.start, { id });
export const resetGetDocumentById = () => action(getDocumentByIdAction.reset);
