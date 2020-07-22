import { AnyAction, Action } from 'redux'
import { ThunkAction } from 'redux-thunk'
import { HYDRATE } from 'next-redux-wrapper'

// Actions
const TRANSACTION_PROCESSING = 'tinlake-ui/transactions/TRANSCATION_PROCESSING'
const TRANSACTION_SUBMITTED = 'tinlake-ui/transactions/TRANSCATION_SUBMITTED'
const RESET_TRANSACTION_STATE = 'tinlake-ui/transactions/RESET_TRANSACTION_STATE'

// extend by potential error messages
export interface TransactionState {
  transactionState: null | 'processing' | 'submitted'
  loadingMessage: null | string
  errorMessage: null | string
  successMessage: null | string
}

const initialState: TransactionState = {
  transactionState: null,
  loadingMessage: 'transaction processing. Please wait...',
  errorMessage: null,
  successMessage: null,
}

// Reducer
export default function reducer(
  state: TransactionState = initialState,
  action: AnyAction = { type: '' }
): TransactionState {
  switch (action.type) {
    case HYDRATE:
      return { ...state, ...action.payload.transactions }
    case TRANSACTION_PROCESSING:
      return {
        ...state,
        transactionState: 'processing',
        successMessage: null,
        errorMessage: null,
        loadingMessage: action.loadingMessage,
      }
    case TRANSACTION_SUBMITTED:
      return {
        ...state,
        transactionState: 'submitted',
        loadingMessage: null,
        successMessage: action.successMessage,
        errorMessage: action.errorMessage,
      }
    case RESET_TRANSACTION_STATE:
      return { ...state, transactionState: null, loadingMessage: null, successMessage: null, errorMessage: null }
    default:
      return state
  }
}

export function transactionSubmitted(
  loadingMessage: string
): ThunkAction<Promise<void>, { transactions: TransactionState }, undefined, Action> {
  return async (dispatch) => {
    dispatch({ loadingMessage, type: TRANSACTION_PROCESSING })
  }
}

export function responseReceived(
  successMessage: null | string,
  errorMessage: null | string
): ThunkAction<Promise<void>, { transactions: TransactionState }, undefined, Action> {
  return async (dispatch) => {
    dispatch({
      successMessage,
      errorMessage,
      type: TRANSACTION_SUBMITTED,
    })
  }
}

export function resetTransactionState(): ThunkAction<
  Promise<void>,
  { transactions: TransactionState },
  undefined,
  Action
> {
  return async (dispatch) => {
    dispatch({
      type: RESET_TRANSACTION_STATE,
    })
  }
}
