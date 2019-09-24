import { AnyAction, Action } from 'redux';
import Tinlake from 'tinlake';
import BN from 'bn.js';
import { ThunkAction } from 'redux-thunk';

// Actions
const LOAD = 'tinlake-ui/dashboard/LOAD';
const RECEIVE = 'tinlake-ui/dashboard/RECEIVE';

export interface DashboardState {
  state: null | 'loading' | 'found';
  data: null | {
    loanCount: BN;
    totalDebt: BN;
    totalBalance: BN;
    totalValueOfNFTs: BN;
  };
}

const initialState: DashboardState = {
  state: null,
  data: null
};

// Reducer
export default function reducer(state: DashboardState = initialState,
                                action: AnyAction = { type: '' }): DashboardState {
  switch (action.type) {
    case LOAD: return { ...state, state: 'loading' };
    case RECEIVE: return { ...state, state: 'found', data: action.data };
    default: return state;
  }
}

// side effects, only as applicable
// e.g. thunks, epics, etc
export function getDashboardData(tinlake: Tinlake):
  ThunkAction<Promise<void>, DashboardState, undefined, Action> {
  return async (dispatch) => {
    const loanCountPromise = tinlake.loanCount();
    const totalDebtPromise = tinlake.getTotalDebt();
    const totalBalancePromise = tinlake.getTotalBalance();
    const totalValueOfNFTsPromise = tinlake.getTotalValueOfNFTs();

    const data = {
      loanCount: await loanCountPromise,
      totalDebt: await totalDebtPromise,
      totalBalance: await totalBalancePromise,
      totalValueOfNFTs: await totalValueOfNFTsPromise
    };

    dispatch({ data, type: RECEIVE });
  };
}

export function subscribeDashboardData(tinlake: Tinlake):
  ThunkAction<() => void, DashboardState, undefined, Action> {
  return (dispatch) => {
    dispatch(getDashboardData(tinlake));

    const interval = setInterval(
      () => dispatch(getDashboardData(tinlake)),
      3600000
    );
    const discard = () => clearInterval(interval);
    return discard as any;
  };
}
