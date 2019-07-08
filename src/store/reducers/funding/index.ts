import { combineReducers } from 'redux';
import { httpRequestReducer } from '../http-request-reducer';
import { CoreapiTransferNFTResponse, FunFundingResponse } from '../../../../clients/centrifuge-node';
import { createFundingAction, settleFundingAction, signFundingAction } from '../../actions/funding';


const create = httpRequestReducer<FunFundingResponse>(createFundingAction);
const sign = httpRequestReducer<FunFundingResponse>(signFundingAction);
const settle = httpRequestReducer<CoreapiTransferNFTResponse>(settleFundingAction);
export default combineReducers({ create, sign, settle });
