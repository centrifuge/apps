import BN from 'bn.js'
import { HYDRATE } from 'next-redux-wrapper'
import { Action, AnyAction } from 'redux'
import { ThunkAction } from 'redux-thunk'
import Apollo from '../services/apollo'

// Actions
const LOAD_PORTFOLIO = 'tinlake-ui/pools/LOAD_PORTFOLIO'
const RECEIVE_PORTFOLIO = 'tinlake-ui/pools/RECEIVE_PORTFOLIO'

export interface TokenBalance {
  token: {
    id: string
    symbol: string
  }
  balance: BN
  value: BN
  supplyAmount: BN
  pendingSupplyCurrency: BN
}

export interface PortfolioState {
  state: null | 'loading' | 'found'
  data: TokenBalance[]
}

const initialState: PortfolioState = {
  state: null,
  data: [],
}

export default function reducer(
  state: PortfolioState = initialState,
  action: AnyAction = { type: '' }
): PortfolioState {
  switch (action.type) {
    case HYDRATE:
      return { ...state, ...(action.payload.pools || {}) }
    case LOAD_PORTFOLIO:
      return { ...state, state: 'loading' }
    case RECEIVE_PORTFOLIO:
      return { ...state, state: 'found', data: action.data }
    default:
      return state
  }
}

export function loadPortfolio(address: string): ThunkAction<Promise<void>, PortfolioState, undefined, Action> {
  return async (dispatch) => {
    const tokenBalances = await Apollo.getPortfolio(address)
    dispatch({ data: tokenBalances, type: RECEIVE_PORTFOLIO })
  }
}
