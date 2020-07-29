import { AnyAction, Action } from 'redux'
import { ThunkAction } from 'redux-thunk'
import { HYDRATE } from 'next-redux-wrapper'

// import { Transaction as WalletTransaction } from '@centrifuge/axis-web3-wallet'

export interface WalletTransaction {
  description: string
  status: 'unconfirmed' | 'pending' | 'succeeded' | 'failed'
  txHahs: string
  externalLink?: string
  showIfClosed?: boolean
}

// Actions
const SET_ACTIVE_TRANSACTION = 'tinlake-ui/transactions/SET_ACTIVE_TRANSACTION'
const QUEUE_TRANSACTION = 'tinlake-ui/transactions/QUEUE_TRANSACTION'

// extend by potential error messages
export type TransactionStatus = 'unconfirmed' | 'pending' | 'succeeded' | 'failed'

export interface Transaction {
    description: string
    methodCall: Function
    onCompleteCallback: (status: TransactionStatus) => void
    status: TransactionStatus
    showIfClosed?: boolean
}

export interface TransactionState {
  active: { [key: string]: Transaction }
  queue: Transaction[]
}

const initialState: TransactionState = {
  active: {},
  queue: []
}

// Reducer
export default function reducer(
  state: TransactionState = initialState,
  action: AnyAction = { type: '' }
): TransactionState {
  switch (action.type) {
    case HYDRATE:
      return { ...state, ...action.payload.transactionQueue }
    case SET_ACTIVE_TRANSACTION:
      return {
        ...state,
        active: {
          ...state.active,
          [action.id]: action.transaction
        }
      }
    case QUEUE_TRANSACTION:
      return {
        ...state,
        queue: [...state.queue, action.transaction],
      }
    default:
      return state
  }
}

const SUCCESS_STATUS = '0x1'

export function createTransaction<R extends any>(
    description: string,
    methodCall: () => Promise<R>,
    onCompleteCallback: (status: TransactionStatus) => void,
    methodResponseValidation?: (response: R) => boolean
): ThunkAction<Promise<void>, { transactions: TransactionState }, undefined, Action> {
    return async (dispatch) => {
        const id = (new Date().getTime()).toString()

        const unconfirmedTx: Transaction = { description, methodCall, onCompleteCallback, status: 'unconfirmed', showIfClosed: true }
        dispatch({ id, transaction: unconfirmedTx, type: SET_ACTIVE_TRANSACTION })
        
        const response = await methodCall()

        // TODO: link to tinlake.js for checking whether transaction has been confirmed yet
        // const pendingTx: Transaction = {
        //   ...unconfirmedTx,
        //   status: 'pending',
        //   showIfClosed: true
        // }
        // dispatch({ id, transaction: pendingTx, type: SET_ACTIVE_TRANSACTION })

        const outcome = methodResponseValidation
          ? methodResponseValidation(response)
          : (response as any).status === SUCCESS_STATUS
        
        onCompleteCallback(outcome ? 'succeeded' : 'failed')
        
        const outcomeTx: Transaction = {
          ...unconfirmedTx,
          status: outcome ? 'succeeded' : 'failed',
          showIfClosed: true,
        }
        dispatch({ id, transaction: outcomeTx, type: SET_ACTIVE_TRANSACTION })

        setTimeout(() => {
          const hiddenTx: Transaction = {
            ...outcomeTx,
            showIfClosed: false
          }
          dispatch({ id, transaction: hiddenTx, type: SET_ACTIVE_TRANSACTION })
        }, 5000)
    }
}   

// Selectors
export function selectWalletTransactions(state?: TransactionState): WalletTransaction[] {
  if (!state) return []
  
  const transactions: WalletTransaction[] = Object.keys(state.active).map((id: string) => {
    const tx = state.active[id]
    return {
      description: tx.description,
      status: tx.status,
      txHahs: '-',
      showIfClosed: tx.showIfClosed
    }
  })

  return transactions
}