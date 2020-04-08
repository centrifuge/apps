import { AnyAction, Action } from 'redux';
import { ThunkAction } from 'redux-thunk';
import { getAnalytics, TinlakeResult, Tranche } from '../services/tinlake/actions'

// Actions
const LOAD_ANALYTICS = 'tinlake-ui/analytics/LOAD_ANALYTICS';
const RECEIVE_ANALYTICS = 'tinlake-ui/analytics/RECEIVE_ANALYTICS';

export interface AnalyticsState {
  state: null | 'loading' | 'found';
  data: null | {
    junior: Tranche,
    senior?: Tranche
  };
}

const initialState: AnalyticsState = {
  state: null,
  data: null
};

export default function reducer(state: AnalyticsState = initialState,
                                action: AnyAction = { type: '' }): AnalyticsState {
  switch (action.type) {
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