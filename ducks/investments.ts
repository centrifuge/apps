import { AnyAction, Action } from 'redux';
import { ThunkAction } from 'redux-thunk';
import { getInvestor, Investor, TinlakeResult} from '../services/tinlake/actions'

// Actions
const LOAD_INVESTOR = 'tinlake-ui/investments/LOAD_INVESTOR';
const INVESTOR_NOT_FOUND = 'tinlake-ui/investments/INVESTOR_NOT_FOUND';
const RECEIVE_INVESTOR = 'tinlake-ui/investments/RECEIVE_INVESTOR';

export interface InvestorState {
  investorState: null | 'loading' | 'not found' | 'found';
  investor: null | Investor;
}

const initialState: InvestorState = {
  investorState: null,
  investor: null
};

// Reducer
export default function reducer(state: InvestorState = initialState,
                                action: AnyAction = { type: '' }): InvestorState {
  switch (action.type) {
    case LOAD_INVESTOR: return { ...state, investorState: 'loading', investor: null };
    case INVESTOR_NOT_FOUND: return { ...state, investorState: 'not found' };
    case RECEIVE_INVESTOR: return { ...state, investorState: 'found', investor: action.investor };
    default: return state;
  }
}

export function loadInvestor(tinlake: any, address: string, refresh = false):
  ThunkAction<Promise<void>, InvestorState, undefined, Action> {
  return async (dispatch) => {
    if (!refresh) {
      dispatch({ type: LOAD_INVESTOR });
    }
    const result : TinlakeResult  = await getInvestor(tinlake, address);
    if (result.errorMsg) {
      dispatch({ type: INVESTOR_NOT_FOUND });
    }   
    dispatch({ type: RECEIVE_INVESTOR, investor: result.data});  
  };
}