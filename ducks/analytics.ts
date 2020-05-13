import { AnyAction, Action } from 'redux';
import { ThunkAction } from 'redux-thunk';
import { getAnalytics, TinlakeResult } from '../services/tinlake/actions';
import { Tranche } from 'tinlake';
import BN from 'bn.js';
import { HYDRATE } from 'next-redux-wrapper';

// Actions
const LOAD_ANALYTICS = 'tinlake-ui/analytics/LOAD_ANALYTICS';
const RECEIVE_ANALYTICS = 'tinlake-ui/analytics/RECEIVE_ANALYTICS';

export interface AnalyticsData {
  junior: Tranche;
  senior?: Tranche;
  availableFunds: BN;
  minJuniorRatio: BN;
  currentJuniorRatio: BN;
}

export interface AnalyticsState {
  state: null | 'loading' | 'found';
  data: null | AnalyticsData;
}

const initialState: AnalyticsState = {
  state: null,
  data: null
};

export default function reducer(state: AnalyticsState = initialState,
                                action: AnyAction = { type: '' }): AnalyticsState {
  switch (action.type) {
    case HYDRATE: return { ...state, ...(action.payload.analytics || {}) };
    case LOAD_ANALYTICS: return { ...state, state: 'loading' };
    case RECEIVE_ANALYTICS: return { ...state, state: 'found', data: action.data };
    default: return state;
  }
}

export function loadAnalyticsData(tinlake: any):
  ThunkAction<Promise<void>, AnalyticsState, undefined, Action> {
  return async (dispatch) => {
    dispatch({ type: LOAD_ANALYTICS });
    const analyticsData : TinlakeResult = await getAnalytics(tinlake);
    dispatch({ data: analyticsData && analyticsData.data, type: RECEIVE_ANALYTICS });
  };
}
