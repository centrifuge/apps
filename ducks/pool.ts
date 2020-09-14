import { AnyAction, Action } from 'redux'
import { ThunkAction } from 'redux-thunk'
import { getPool } from '../services/tinlake/actions'
import { Tranche } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import { HYDRATE } from 'next-redux-wrapper'

// Actions
const LOAD_POOL = 'tinlake-ui/pool/LOAD_POOL'
const RECEIVE_POOL = 'tinlake-ui/pool/RECEIVE_POOL'

export interface PoolData {
  junior: Tranche
  senior?: Tranche
  availableFunds: BN
  minJuniorRatio: BN
  maxJuniorRatio: BN
  currentJuniorRatio: BN
  maxReserve: BN
}

export interface PoolState {
  state: null | 'loading' | 'found'
  data: null | PoolData
}

const initialState: PoolState = {
  state: null,
  data: null,
}

export default function reducer(state: PoolState = initialState, action: AnyAction = { type: '' }): PoolState {
  switch (action.type) {
    case HYDRATE:
      return { ...state, ...(action.payload.pool || {}) }
    case LOAD_POOL:
      return { ...state, state: 'loading' }
    case RECEIVE_POOL:
      return { ...state, state: 'found', data: action.data }
    default:
      return state
  }
}

export function loadPool(tinlake: any): ThunkAction<Promise<void>, PoolState, undefined, Action> {
  return async (dispatch) => {
    dispatch({ type: LOAD_POOL })
    const poolData = await getPool(tinlake)
    dispatch({ data: poolData, type: RECEIVE_POOL })
  }
}
