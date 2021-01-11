import { HYDRATE } from 'next-redux-wrapper'
import { Action, AnyAction } from 'redux'
import { ThunkAction } from 'redux-thunk'
import Apollo from '../services/apollo'

// Actions
const LOAD_REWARDS = 'tinlake-ui/rewards/LOAD_REWARDS'
const RECEIVE_REWARDS = 'tinlake-ui/rewards/RECEIVE_REWARDS'

export interface RewardsData {
  toDateAggregateValue: string | null
  rewardRate: string | null
}

export interface RewardsState {
  state: null | 'loading' | 'found'
  data: null | RewardsData
}

const initialState: RewardsState = {
  state: null,
  data: null,
}

export default function reducer(state: RewardsState = initialState, action: AnyAction = { type: '' }): RewardsState {
  switch (action.type) {
    case HYDRATE:
      return { ...state, ...(action.payload.rewards || {}) }
    case LOAD_REWARDS:
      return { ...state, state: 'loading' }
    case RECEIVE_REWARDS:
      return { ...state, state: 'found', data: action.data }
    default:
      return state
  }
}

export function loadRewards(): ThunkAction<Promise<void>, RewardsState, undefined, Action> {
  return async (dispatch) => {
    dispatch({ type: LOAD_REWARDS })
    const data = await Apollo.getRewards()
    dispatch({ data, type: RECEIVE_REWARDS })
  }
}
