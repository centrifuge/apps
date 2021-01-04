import { ITinlake } from '@centrifuge/tinlake-js'
import { HYDRATE } from 'next-redux-wrapper'
import { Action, AnyAction } from 'redux'
import { ThunkAction } from 'redux-thunk'
import Apollo from '../services/apollo'

// Actions
const LOAD_USER_REWARDS = 'tinlake-ui/user-rewards/LOAD_USER_REWARDS'
const RECEIVE_USER_REWARDS = 'tinlake-ui/user-rewards/RECEIVE_USER_REWARDS'
const LOAD_CENT_ADDR = 'tinlake-ui/user-rewards/LOAD_CENT_ADDR'
const RECEIVE_CENT_ADDR = 'tinlake-ui/user-rewards/RECEIVE_CENT_ADDR'

// just used for readability
type BigDecimalString = string
type BigIntString = string

export interface UserRewardsData {
  claims: {
    centAddress: string
    rewardsAccumulated: BigDecimalString
  }[]
  eligible: boolean
  claimableRewards: BigDecimalString
  totalRewards: BigDecimalString
  nonZeroBalanceSince: BigIntString
}

export interface UserRewardsState {
  centAddrState: null | 'loading' | 'found' | 'empty'
  // the Centrifuge Chain address set on Ethereum
  centAddr: null | string
  state: null | 'loading' | 'found'
  data: null | UserRewardsData
}

const initialState: UserRewardsState = {
  centAddrState: null,
  centAddr: null,
  state: null,
  data: null,
}

export default function reducer(
  state: UserRewardsState = initialState,
  action: AnyAction = { type: '' }
): UserRewardsState {
  switch (action.type) {
    case HYDRATE:
      return { ...state, ...(action.payload.userRewards || {}) }
    case LOAD_USER_REWARDS:
      return { ...state, state: 'loading' }
    case RECEIVE_USER_REWARDS:
      return { ...state, state: 'found', data: action.data }
    case LOAD_CENT_ADDR:
      return { ...state, centAddrState: 'loading' }
    case RECEIVE_CENT_ADDR: {
      if (action.data === '0x0000000000000000000000000000000000000000000000000000000000000000') {
        return { ...state, centAddrState: 'empty', centAddr: null }
      }
      return { ...state, centAddrState: 'found', centAddr: action.data }
    }
    default:
      return state
  }
}

export function loadCentAddr(
  ethAddr: string,
  tinlake: ITinlake
): ThunkAction<Promise<void>, UserRewardsState, undefined, Action> {
  return async (dispatch) => {
    dispatch({ type: LOAD_CENT_ADDR })
    const centAddr = await tinlake.getClaimRADAddress(ethAddr)
    dispatch({ data: centAddr, type: RECEIVE_CENT_ADDR })
  }
}

// TODO remove, just for debugging
export function setCentAddr(addr: string): ThunkAction<Promise<void>, UserRewardsState, undefined, Action> {
  return async (dispatch) => {
    dispatch({ data: addr, type: RECEIVE_CENT_ADDR })
  }
}

export function loadUserRewards(address: string): ThunkAction<Promise<void>, UserRewardsState, undefined, Action> {
  return async (dispatch) => {
    dispatch({ type: LOAD_USER_REWARDS })
    const poolsData = await Apollo.getUserRewards(address)
    dispatch({ data: poolsData, type: RECEIVE_USER_REWARDS })
  }
}
