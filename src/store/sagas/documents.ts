import { put, takeEvery } from 'redux-saga/effects';
import { push } from 'connected-react-router';
import routes from '../../routes';
import { alertError } from '../actions/notifications';
import {
  createDocumentAction,
  getDocumentByIdAction,
  getDocumentsAction,
  updateDocumentAction,
} from '../actions/documents';


const documents = {
  'first_id': {
    _id: 'first_id',
    createdAt: '2019-07-09T10:54:59.900Z',
    attributes: {

      '_schema': {
        key:
          '0x9ed63b1df0c1b6dc14b777a767ccb0562b7a0adf6f51bf0d90476f6833005f9a',
        type: 'string',
        value: 'my_doc',
      },

      'reference_id': {
        key:
          '0x9ed63b1df0c1b6dc14b777a767ccb0562b7a0adf6f51bf0d90476f6833005f9a',
        type: 'string',
        value: 'reference nr1',
      },

      'customer': {
        key:
          '0x9ed63b1df0c1b6dc14b777a767ccb0562b7a0adf6f51bf0d90476f6833005f9a',
        type: 'string',
        value: 'some customer',
      },

      'amount': {
        key:
          '0x9ed63b1df0c1b6dc14b777a767ccb0562b7a0adf6f51bf0d90476f6833005f9a',
        type: 'decimal',
        value: '100',
      },
    },
  },
  'second_id': {
    _id: 'second_id',
    createdAt: '2019-07-09T10:54:59.900Z',
    attributes: {

      '_schema': {
        key:
          '0x9ed63b1df0c1b6dc14b777a767ccb0562b7a0adf6f51bf0d90476f6833005f9a',
        type: 'string',
        value: 'good_schema',
      },

      'reference_id': {
        key:
          '0x9ed63b1df0c1b6dc14b777a767ccb0562b7a0adf6f51bf0d90476f6833005f9a',
        type: 'string',
        value: 'reference nr2',
      },

      'customer': {
        key:
          '0x9ed63b1df0c1b6dc14b777a767ccb0562b7a0adf6f51bf0d90476f6833005f9a',
        type: 'string',
        value: 'some customer2',
      },

      'amount': {
        key:
          '0x9ed63b1df0c1b6dc14b777a767ccb0562b7a0adf6f51bf0d90476f6833005f9a',
        type: 'integer',
        value: '101',
      },
    },
  },
};

export function* getDocuments() {
  try {
    // TODO add servers call
    const response = {
      data: Object.values(documents),
    };
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
    // TODO add servers call
    const response = {
      data: documents[id],
    };
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
    //const { document } = action;
    // TODO add servers call
    const response = {
      data: {},
    };
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
    // TODO add server call
    const response = {
      data: document,
    };

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

export default {
  watchGetDocuments: () => takeEvery(getDocumentsAction.start, getDocuments),
  watchGetDocumentById: () =>
    takeEvery(getDocumentByIdAction.start, getDocumentById),
  watchCreateDocument: () => takeEvery(createDocumentAction.start, createDocument),
  watchUpdateDocument: () => takeEvery(updateDocumentAction.start, updateDocument),
};
