import { AnyAction, Action } from 'redux'
import { ThunkAction } from 'redux-thunk'
import { getPool } from '../services/tinlake/actions'
import { Tranche } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import { HYDRATE } from 'next-redux-wrapper'

// Actions
const LOAD_POOL = 'tinlake-ui/pool/LOAD_POOL'
const RECEIVE_POOL = 'tinlake-ui/pool/RECEIVE_POOL'

export interface PoolTranche extends Tranche {
  pendingInvestments?: BN
  pendingRedemptions?: BN
  decimals?: number
  address?: string
  inMemberlist?: boolean
}

export interface PoolData {
  junior: PoolTranche
  senior?: PoolTranche
  availableFunds: BN
  minJuniorRatio: BN
  currentJuniorRatio: BN
}

export interface ArchivedPoolData {
  totalFinancedCurrency: string
  financingsCount: string
  seniorInterestRate: string
  averageFinancingFee: string
}

export type EpochData = {
  id: number
  state: 'open' | 'can-be-closed' | 'in-submission-period' | 'in-challenge-period' | 'challenge-period-ended'
  isBlockedState: boolean
  minimumEpochTime: number
  minimumEpochTimeLeft: number
  minChallengePeriodEnd: number
  lastEpochClosed: number
  latestBlockTimestamp: number
  seniorOrderedInEpoch: number
  juniorOrderedInEpoch: number
}

export interface PoolDataV3 extends PoolData {
  netAssetValue: BN
  reserve: BN
  maxJuniorRatio: BN
  maxReserve: BN
  outstandingVolume: BN
  totalPendingInvestments: BN
  totalRedemptionsCurrency: BN
  epoch?: EpochData
}

export interface PoolState {
  state: null | 'loading' | 'found'
  data: null | PoolData | PoolDataV3
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
