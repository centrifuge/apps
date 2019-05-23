import { combineReducers } from 'redux';
import { httpRequestReducer } from '../http-request-reducer';
import { FunFundingResponse } from '../../../../clients/centrifuge-node';
import { createFundingAction } from '../../actions/funding';


const create = httpRequestReducer<FunFundingResponse>(createFundingAction);
export default combineReducers({ create });
