import { UserWithRelations } from '@centrifuge/onboarding-api/src/controllers/user.controller'
import { Pool } from '@centrifuge/onboarding-api/src/services/pool.service'
import { HYDRATE } from 'next-redux-wrapper'
import { Action, AnyAction } from 'redux'
import { ThunkAction } from 'redux-thunk'

// Actions
const LOAD_USERS = 'onboarding-ui/users/LOAD_USERS'
const RECEIVE_USERS = 'onboarding-ui/users/RECEIVE_USERS'
const SET_ACTIVE_POOL = 'onboarding-ui/users/SET_ACTIVE_POOL'

export interface UsersState {
  state: null | 'loading' | 'found'
  activePool: null | Pool
  data: null | UserWithRelations[]
}

const initialState: UsersState = {
  state: null,
  activePool: null,
  data: null,
}

export default function reducer(state: UsersState = initialState, action: AnyAction = { type: '' }): UsersState {
  switch (action.type) {
    case HYDRATE:
      return { ...state, ...(action.payload.data || {}) }
    case LOAD_USERS:
      return { ...state, state: 'loading' }
    case SET_ACTIVE_POOL:
      return { ...state, activePool: action.pool }
    case RECEIVE_USERS:
      return { ...state, state: 'found', data: action.data }
    default:
      return state
  }
}

export function loadInvestors(
  onboardingApiHost: string,
  pool: Pool
): ThunkAction<Promise<void>, { users: UsersState }, undefined, Action> {
  return async (dispatch) => {
    dispatch({ type: LOAD_USERS })
    dispatch({ pool, type: SET_ACTIVE_POOL })
    const req = await fetch(`${onboardingApiHost}users/${pool.addresses.ROOT_CONTRACT}`)
    const body = await req.json()
    dispatch({ type: RECEIVE_USERS, data: body })
  }
}
