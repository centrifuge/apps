import { call, put, takeEvery } from 'redux-saga/effects';
import { push } from 'connected-react-router';
import routes from '../../routes';
import { alertError } from '../actions/notifications';
import {
  createDocumentAction,
  getDocumentByIdAction,
  getDocumentsAction,
  mintNftForDocumentAction,
  updateDocumentAction,
} from '../actions/documents';
import { httpClient } from '../../http-client';


export function* getDocuments() {
  try {
    // TODO add servers call
    const response = yield call(httpClient.documents.read);
    yield put({
      type: getDocumentsAction.success,
      payload: response.data,
    });
  } catch (e) {
    yield put({ type: getDocumentsAction.fail, payload: e });
  }
}

export function* getDocumentById(action) {
  try {
    const { id } = action;
    const response = yield call(httpClient.documents.readById, id);
    yield put({
      type: getDocumentByIdAction.success,
      payload: response.data,
    });
  } catch (e) {
    yield put({ type: getDocumentByIdAction.fail, payload: e });
  }
}

export function* createDocument(action) {
  try {
    const { document } = action;
    const response = yield call(httpClient.documents.create, document);
    yield put({
      type: createDocumentAction.success,
      payload: response.data,
    });
    yield put(push(routes.documents.index));
  } catch (e) {
    yield put({ type: createDocumentAction.fail, payload: e });
    yield put(alertError(
      'Failed to create document',
      e.message,
      { onConfirmAction: { type: createDocumentAction.clearError } },
    ));
  }
}

export function* updateDocument(action) {
  try {
    const { document } = action;
    const response = yield call(httpClient.documents.update, document);

    yield put({
      type: updateDocumentAction.success,
      payload: response.data,
    });
    yield put(push(routes.documents.index));
  } catch (e) {
    yield put({ type: updateDocumentAction.fail, payload: e });
    yield put(alertError(
      'Failed to update document',
      e.message,
      { onConfirmAction: { type: updateDocumentAction.clearError } },
    ));

  }
}


export function* mintNft(action) {
  try {
    const { id, payload } = action;
    const response = yield call(httpClient.documents.mint, id, payload);

    yield put({
      type: mintNftForDocumentAction.success,
      payload: response.data,
    });
    yield put(push(routes.documents.index));
  } catch (e) {
    yield put({ type: mintNftForDocumentAction.fail, payload: e });
    yield put(alertError(
      'Failed to mint nft',
      e.message,
      { onConfirmAction: { type: updateDocumentAction.clearError } },
    ));

  }
}


export default {
  watchGetDocuments: () => takeEvery(getDocumentsAction.start, getDocuments),
  watchGetDocumentById: () =>
    takeEvery(getDocumentByIdAction.start, getDocumentById),
  watchCreateDocument: () => takeEvery(createDocumentAction.start, createDocument),
  watchUpdateDocument: () => takeEvery(updateDocumentAction.start, updateDocument),
  watchMintNftForDocument: () => takeEvery(mintNftForDocumentAction.start, mintNft),
};
