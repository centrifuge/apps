import { AddressStatus } from '@centrifuge/onboard-api/src/controllers/types'
import { HYDRATE } from 'next-redux-wrapper'
import { Action, AnyAction } from 'redux'
import { ThunkAction } from 'redux-thunk'
import config, { Pool, UpcomingPool } from '../config'
import { AuthState } from './auth'

// Actions
const LOAD_STATUS = 'tinlake-ui/onboarding/LOAD_STATUS'
const RECEIVE_STATUS = 'tinlake-ui/onboarding/RECEIVE_STATUS'
const CLEAR_STATUS = 'tinlake-ui/onboarding/CLEAR_STATUS'

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
    case CLEAR_STATUS:
      return { ...state, state: null, data: null }
    case RECEIVE_STATUS:
      return { ...state, state: 'found', data: action.data }
    default:
      return state
  }
}

// TODO: support upcoming pools without root contract id
export function loadOnboardingStatus(
  pool: Pool | UpcomingPool
): ThunkAction<Promise<void>, { auth: AuthState; onboarding: OnboardingState }, undefined, Action> {
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
    } else {
      dispatch({ type: CLEAR_STATUS })
    }
  }
}
