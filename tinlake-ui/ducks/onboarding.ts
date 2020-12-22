import { HYDRATE } from 'next-redux-wrapper'
import { Action, AnyAction } from 'redux'
import { ThunkAction } from 'redux-thunk'
import { AddressStatus } from '@centrifuge/onboard-api/src/controllers/types'
import config, { Pool, UpcomingPool } from '../config'

// Actions
const LOAD_STATUS = 'tinlake-ui/onboarding/LOAD_STATUS'
const RECEIVE_STATUS = 'tinlake-ui/onboarding/RECEIVE_STATUS'

export interface OnboardingState {
  state: null | 'loading' | 'found'
  data: null | AddressStatus
}

const initialState: OnboardingState = {
  state: null,
  data: null,
}

export default function reducer(
  state: OnboardingState = initialState,
  action: AnyAction = { type: '' }
): OnboardingState {
  switch (action.type) {
    case HYDRATE:
      return { ...state, ...(action.payload.data || {}) }
    case LOAD_STATUS:
      return { ...state, state: 'loading' }
    case RECEIVE_STATUS:
      return { ...state, state: 'found', data: action.data }
    default:
      return state
  }
}

// TODO: support upcoming pools without root contract id
export function loadOnboardingStatus(pool: Pool | UpcomingPool): ThunkAction<Promise<void>, any, undefined, Action> {
  return async (dispatch, getState) => {
    // TOOD: fix ignoring upcoming pools
    if (!('addresses' in pool)) return

    const poolId = (pool as Pool).addresses.ROOT_CONTRACT
    const address = await getState().auth.address

    if (address) {
      dispatch({ type: LOAD_STATUS })

      const req = await fetch(`${config.onboardAPIHost}pools/${poolId}/addresses/${address}`)
      const body = await req.json()
      dispatch({ type: RECEIVE_STATUS, data: body })
    }
  }
}
