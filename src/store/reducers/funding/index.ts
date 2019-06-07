import { combineReducers } from 'redux';
import { httpRequestReducer } from '../http-request-reducer';
import { FunFundingResponse } from '../../../../clients/centrifuge-node';
import { createFundingAction, signFundingAction } from '../../actions/funding';


const create = httpRequestReducer<FunFundingResponse>(createFundingAction);
const sign = httpRequestReducer<FunFundingResponse>(signFundingAction);
export default combineReducers({ create, sign });
