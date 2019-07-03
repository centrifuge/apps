import { combineReducers } from 'redux';
import { httpRequestReducer } from '../http-request-reducer';
import { createTransferDetailsAction, updateTransferDetailsAction } from '../../actions/transfer-details';

const create = httpRequestReducer<any>(createTransferDetailsAction);
const update = httpRequestReducer<any>(updateTransferDetailsAction);
export default combineReducers({ create, update });
