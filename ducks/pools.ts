import { AnyAction, Action } from 'redux';
import { ThunkAction } from 'redux-thunk';
import { HYDRATE } from 'next-redux-wrapper';
import BN from 'bn.js';
import Apollo from '../services/apollo';

// Actions
const LOAD_POOLS = 'tinlake-ui/pools/LOAD_POOLS';
const RECEIVE_POOLS = 'tinlake-ui/pools/RECEIVE_POOLS';

export interface PoolData {
  id: string;
  name: string;
  asset: string;
  ongoingLoans: number;
  totalDebt: BN;
  totalRepaysAggregatedAmount: BN;
  weightedInterestRate: BN;
  seniorInterestRate: BN;
}

export interface PoolsData {
  ongoingPools: number;
  ongoingLoans: number;
  totalDebt: BN;
  totalRepaysAggregatedAmount: BN;
  pools: PoolData[];
}

export interface PoolsState {
  state: null | 'loading' | 'found';
  data: null | PoolsData;
}

const initialState: PoolsState = {
  state: null,
  data: null
};

export default function reducer(state: PoolsState = initialState,
                                action: AnyAction = { type: '' }): PoolsState {
  switch (action.type) {
    case HYDRATE: return { ...state, ...(action.payload.pools || {}) };
    case LOAD_POOLS: return { ...state, state: 'loading' };
    case RECEIVE_POOLS: return { ...state, state: 'found', data: action.data };
    default: return state;
  }
}

export function loadPools(): ThunkAction<Promise<void>, PoolsState, undefined, Action> {
  return async (dispatch) => {
    dispatch({ type: LOAD_POOLS });
    const poolsData = await Apollo.getPools();
    dispatch({ data: poolsData, type: RECEIVE_POOLS });
  };
}
