import { ITinlake } from '@centrifuge/tinlake-js'
import { HYDRATE } from 'next-redux-wrapper'
import { Action, AnyAction } from 'redux'
import { ThunkAction } from 'redux-thunk'
import Apollo from '../services/apollo'
import { accountIdToCentChainAddr } from '../services/centChain/accountIdToCentChainAddr'

// Actions
const LOAD_USER_REWARDS = 'tinlake-ui/user-rewards/LOAD_USER_REWARDS'
const RECEIVE_USER_REWARDS = 'tinlake-ui/user-rewards/RECEIVE_USER_REWARDS'
const LOAD_CENT_ADDR = 'tinlake-ui/user-rewards/LOAD_CENT_ADDR'
const RECEIVE_CENT_ADDR = 'tinlake-ui/user-rewards/RECEIVE_CENT_ADDR'
const RECEIVE_CENT_ADDR_EMPTY = 'tinlake-ui/user-rewards/RECEIVE_CENT_ADDR_EMPTY'

// just used for readability
type BigDecimalString = string
type BigIntString = string

export interface UserRewardsEthData {
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
  ethCentAddrState: null | 'loading' | 'found' | 'empty'
  // the Centrifuge Chain address set on Ethereum
  ethCentAddr: null | string
  ethState: null | 'loading' | 'found'
  ethData: null | UserRewardsEthData
}

const initialState: UserRewardsState = {
  ethCentAddrState: null,
  ethCentAddr: null,
  ethState: null,
  ethData: null,
}

export default function reducer(
  state: UserRewardsState = initialState,
  action: AnyAction = { type: '' }
): UserRewardsState {
  switch (action.type) {
    case HYDRATE:
      return { ...state, ...(action.payload.userRewards || {}) }
    case LOAD_USER_REWARDS:
      return { ...state, ethState: 'loading' }
    case RECEIVE_USER_REWARDS:
      return { ...state, ethState: 'found', ethData: action.data }
    case LOAD_CENT_ADDR:
      return { ...state, ethCentAddrState: 'loading' }
    case RECEIVE_CENT_ADDR_EMPTY:
      return { ...state, ethCentAddrState: 'empty', ethCentAddr: null }
    case RECEIVE_CENT_ADDR:
      return { ...state, ethCentAddrState: 'found', ethCentAddr: action.data }
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
    const accountId = await tinlake.getClaimRADAddress(ethAddr)
    if (accountId === '0x0000000000000000000000000000000000000000000000000000000000000000') {
      dispatch({ type: RECEIVE_CENT_ADDR_EMPTY })
      return
    }
    dispatch({ data: accountIdToCentChainAddr(accountId), type: RECEIVE_CENT_ADDR })
  }
}

export function loadUserRewards(address: string): ThunkAction<Promise<void>, UserRewardsState, undefined, Action> {
  return async (dispatch) => {
    dispatch({ type: LOAD_USER_REWARDS })
    const poolsData = await Apollo.getUserRewards(address)
    dispatch({ data: poolsData, type: RECEIVE_USER_REWARDS })
  }
}
