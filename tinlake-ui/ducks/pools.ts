import BN from 'bn.js'
import { HYDRATE } from 'next-redux-wrapper'
import { Action, AnyAction } from 'redux'
import { ThunkAction } from 'redux-thunk'
import Apollo from '../services/apollo'
import { PoolStatus } from './pool'

// Actions
const LOAD_POOLS = 'tinlake-ui/pools/LOAD_POOLS'
const RECEIVE_POOLS = 'tinlake-ui/pools/RECEIVE_POOLS'

export interface PoolData {
  id: string
  name: string
  slug: string
  isUpcoming: boolean
  isArchived: boolean
  isOversubscribed: boolean
  asset: string
  ongoingLoans: number
  totalDebt: BN
  totalDebtNum: number
  totalRepaysAggregatedAmount: BN
  totalRepaysAggregatedAmountNum: number
  weightedInterestRate: BN
  weightedInterestRateNum: number
  seniorInterestRate: BN
  seniorInterestRateNum: number
  order: number
  version: number
  totalFinancedCurrency: BN
  financingsCount?: number
  status?: PoolStatus
  reserve: BN
  assetValue: BN
  juniorYield14Days: BN | null
  seniorYield14Days: BN | null
  icon: string | null
}

export interface PoolsData {
  ongoingPools: number
  ongoingLoans: number
  totalDebt: BN
  totalRepaysAggregatedAmount: BN
  totalFinancedCurrency: BN
  totalValue: BN
  pools: PoolData[]
}

export interface PoolsState {
  state: null | 'loading' | 'found'
  data: null | PoolsData
}

const initialState: PoolsState = {
  state: null,
  data: null,
}

export default function reducer(state: PoolsState = initialState, action: AnyAction = { type: '' }): PoolsState {
  switch (action.type) {
    case HYDRATE:
      return { ...state, ...(action.payload.pools || {}) }
    case LOAD_POOLS:
      return { ...state, state: 'loading' }
    case RECEIVE_POOLS:
      return { ...state, state: 'found', data: action.data }
    default:
      return state
  }
}

export function loadPools(): ThunkAction<Promise<void>, PoolsState, undefined, Action> {
  return async (dispatch) => {
    dispatch({ type: LOAD_POOLS })
    const poolsData = await Apollo.getPools()
    dispatch({ data: poolsData, type: RECEIVE_POOLS })
  }
}
