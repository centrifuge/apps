import { ITinlake } from '@centrifuge/tinlake-js'
import { HYDRATE } from 'next-redux-wrapper'
import { Action, AnyAction } from 'redux'
import { ThunkAction } from 'redux-thunk'
import Apollo from '../services/apollo'
import { centChainService } from '../services/centChain'
import { accountIdToCentChainAddr } from '../services/centChain/accountIdToCentChainAddr'

// Actions
const LOAD_USER_REWARDS_ETH = 'tinlake-ui/user-rewards/LOAD_USER_REWARDS_ETH'
const RECEIVE_USER_REWARDS_ETH = 'tinlake-ui/user-rewards/RECEIVE_USER_REWARDS_ETH'
const LOAD_CENT_ADDR = 'tinlake-ui/user-rewards/LOAD_CENT_ADDR'
const RECEIVE_CENT_ADDR = 'tinlake-ui/user-rewards/RECEIVE_CENT_ADDR'
const RECEIVE_CENT_ADDR_EMPTY = 'tinlake-ui/user-rewards/RECEIVE_CENT_ADDR_EMPTY'
const LOAD_USER_REWARDS_CENT = 'tinlake-ui/user-rewards/LOAD_USER_REWARDS_CENT'
const RECEIVE_USER_REWARDS_CENT = 'tinlake-ui/user-rewards/RECEIVE_USER_REWARDS_CENT'

// just used for readability
type AccountIDString = string
type SS58AddrString = string
type BigDecimalString = string
type BigIntString = string

export interface UserRewardsEthData {
  links: {
    centAccountId: AccountIDString
    centAddress: SS58AddrString
    rewardsAccumulated: BigDecimalString
  }[]
  claimable: boolean
  linkableRewards: BigDecimalString
  totalRewards: BigDecimalString
  nonZeroBalanceSince: BigIntString
}

export interface UserRewardsCentData {
  accountID: AccountIDString
  claimed: BigDecimalString // TODO is that correct?
}

export interface UserRewardsState {
  ethCentAddrState: null | 'loading' | 'found' | 'empty'
  // the Centrifuge Chain address set on Ethereum
  ethCentAddr: null | string
  ethState: null | 'loading' | 'found'
  ethData: null | UserRewardsEthData
  centState: null | 'loading' | 'found'
  centData: null | UserRewardsCentData[]
}

const initialState: UserRewardsState = {
  ethCentAddrState: null,
  ethCentAddr: null,
  ethState: null,
  ethData: null,
  centState: null,
  centData: null,
}

export default function reducer(
  state: UserRewardsState = initialState,
  action: AnyAction = { type: '' }
): UserRewardsState {
  switch (action.type) {
    case HYDRATE:
      return { ...state, ...(action.payload.userRewards || {}) }
    case LOAD_USER_REWARDS_ETH:
      return { ...state, ethState: 'loading' }
    case RECEIVE_USER_REWARDS_ETH:
      return { ...state, ethState: 'found', ethData: action.data }
    case LOAD_CENT_ADDR:
      return { ...state, ethCentAddrState: 'loading' }
    case RECEIVE_CENT_ADDR_EMPTY:
      return { ...state, ethCentAddrState: 'empty', ethCentAddr: null }
    case RECEIVE_CENT_ADDR:
      return { ...state, ethCentAddrState: 'found', ethCentAddr: action.data }
    case LOAD_USER_REWARDS_CENT:
      return { ...state, centState: 'loading' }
    case RECEIVE_USER_REWARDS_CENT:
      return { ...state, centState: 'found', centData: action.data }
    default:
      return state
  }
}

export function loadCentAddr(
  ethAddr: string,
  tinlake: ITinlake
): ThunkAction<Promise<void>, { userRewards: UserRewardsState }, undefined, Action> {
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

export function loadUserRewards(
  address: string
): ThunkAction<Promise<void>, { userRewards: UserRewardsState }, undefined, Action> {
  return async (dispatch) => {
    dispatch({ type: LOAD_USER_REWARDS_ETH })
    const poolsData = await Apollo.getUserRewards(address)
    dispatch({ data: poolsData, type: RECEIVE_USER_REWARDS_ETH })
    dispatch(loadCentClaimedRewards())
  }
}

export function loadCentClaimedRewards(): ThunkAction<
  Promise<void>,
  { userRewards: UserRewardsState },
  undefined,
  Action
> {
  return async (dispatch, getState) => {
    const { userRewards } = getState()

    if (userRewards.ethData === null) {
      return
    }

    dispatch({ type: LOAD_USER_REWARDS_CENT })
    const data = await Promise.all(
      userRewards.ethData.links.map((l) => centChainService().claimedRADRewards(l.centAddress))
    )
    dispatch({ data, type: RECEIVE_USER_REWARDS_CENT })
  }
}

export function loadClaimsTree(): ThunkAction<Promise<void>, { userRewards: UserRewardsState }, undefined, Action> {
  return async (dispatch, getState) => {
    const r = await fetch(config.rewardsTreeUrl)
    if (!r.ok) {
      throw new Error(`could not load rewards tree from ${config.rewardsTreeUrl}`)
    }
    const json = await r.json()
    console.log('json', json)
  }
}
