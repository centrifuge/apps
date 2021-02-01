import { HYDRATE } from 'next-redux-wrapper'
import { Action, AnyAction } from 'redux'
import { ThunkAction } from 'redux-thunk'
import { getInvestor } from '../services/tinlake/actions'

// Actions
const LOAD_INVESTOR = 'tinlake-ui/investments/LOAD_INVESTOR'
const INVESTOR_NOT_FOUND = 'tinlake-ui/investments/INVESTOR_NOT_FOUND'
const RECEIVE_INVESTOR = 'tinlake-ui/investments/RECEIVE_INVESTOR'

export interface InvestorState {
  investorState: null | 'loading' | 'not found' | 'found'
  investor: null | any
}

const initialState: InvestorState = {
  investorState: null,
  investor: null,
}

// Reducer
export default function reducer(state: InvestorState = initialState, action: AnyAction = { type: '' }): InvestorState {
  switch (action.type) {
    case HYDRATE:
      return { ...state, ...(action.payload.investments || {}) }
    case LOAD_INVESTOR:
      return { ...state, investorState: 'loading', investor: null }
    case INVESTOR_NOT_FOUND:
      return { ...state, investorState: 'not found' }
    case RECEIVE_INVESTOR:
      return { ...state, investorState: 'found', investor: action.investor }
    default:
      return state
  }
}

export function loadInvestor(
  tinlake: any,
  address: string,
  refresh = false
): ThunkAction<Promise<void>, { investments: InvestorState }, undefined, Action> {
  return async (dispatch) => {
    if (!refresh) {
      dispatch({ type: LOAD_INVESTOR })
    }
    const investor = await getInvestor(tinlake, address)
    if (!investor) {
      dispatch({ type: INVESTOR_NOT_FOUND })
    } else {
      dispatch({ investor, type: RECEIVE_INVESTOR })
    }
  }
}
