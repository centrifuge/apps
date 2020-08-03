import { AnyAction, Action } from 'redux'
import { ThunkAction } from 'redux-thunk'
import { HYDRATE } from 'next-redux-wrapper'
import { ITinlake } from 'tinlake'
import { initTinlake } from '../services/tinlake'
import * as actions from '../services/tinlake/actions'

// TODO: should be imported from @centrifuge/axis-web3-wallet
export interface WalletTransaction {
  description: string
  status: 'unconfirmed' | 'pending' | 'succeeded' | 'failed'
  txHahs: string
  externalLink?: string
  showIfClosed?: boolean
}

type TransactionAction = { [P in keyof typeof actions]: typeof actions[P] extends actions.TinlakeAction? P : never}[keyof typeof actions];

type RemoveFirstFromTuple<T extends any[]> = 
  T['length'] extends 0 ? undefined :
  (((...b: T) => void) extends (a: any, ...b: infer I) => void ? I : [])

// Actions
const START_PROCESSING = 'tinlake-ui/transactions/START_PROCESSING'
const STOP_PROCESSING = 'tinlake-ui/transactions/STOP_PROCESSING'
const SET_ACTIVE_TRANSACTION = 'tinlake-ui/transactions/SET_ACTIVE_TRANSACTION'
const QUEUE_TRANSACTION = 'tinlake-ui/transactions/QUEUE_TRANSACTION'
const DEQUEUE_TRANSACTION = 'tinlake-ui/transactions/DEQUEUE_TRANSACTION'

export type TransactionId = string
export type TransactionStatus = 'unconfirmed' | 'pending' | 'succeeded' | 'failed'

interface TinlakeConfig {
  addresses?: any
  contractConfig?: {
    JUNIOR_OPERATOR: 'ALLOWANCE_OPERATOR'
    SENIOR_OPERATOR: 'ALLOWANCE_OPERATOR' | 'PROPORTIONAL_OPERATOR'
  }
}

export interface Transaction<Params extends any[]> {
  id: string
  description: string
  action: (...args: Params) => any
  args: Params
  status: TransactionStatus
  tinlakeConfig: TinlakeConfig
  showIfClosed: boolean
}

export interface TransactionState {
  processing: boolean
  active: { [key: string]: Transaction<any> }
  queue: { [key: string]: Transaction<any> }
}

const initialState: TransactionState = {
  processing: false,
  active: {},
  queue: {},
}

// Reducer
export default function reducer(
  state: TransactionState = initialState,
  action: AnyAction = { type: '' }
): TransactionState {
  switch (action.type) {
    case HYDRATE:
      // TODO: change pending transactions to failed transactions
      return { ...state, ...action.payload.transactionQueue }
    case START_PROCESSING:
      return {
        ...state,
        processing: true,
      }
    case STOP_PROCESSING:
      return {
        ...state,
        processing: false,
      }
    case SET_ACTIVE_TRANSACTION:
      return {
        ...state,
        active: {
          ...state.active,
          [action.id]: action.transaction,
        },
      }
    case QUEUE_TRANSACTION:
      return {
        ...state,
        queue: {
          ...state.queue,
          [action.id]: action.transaction,
        },
      }
    case DEQUEUE_TRANSACTION:
      const newQueue = state.queue

      if (action.id in state.queue) {
        delete newQueue[action.id]
      }

      return {
        ...state,
        queue: newQueue,
      }
    default:
      return state
  }
}

const SUCCESS_STATUS = '0x1'

export function createTransaction<Params extends any[]>(
  description: string,
  tinlake: ITinlake,
  action: (...args: Params) => any,
  args: Params
): ThunkAction<Promise<string>, { asyncTransactions: TransactionState }, undefined, Action> {
  return async (dispatch, getState) => {
    const actionName = action.name as keyof typeof actions
    console.log(actionName)
    const id: TransactionId = (new Date().getTime() + Math.floor(Math.random() * 1000000)).toString()

    const tinlakeConfig = {
      addresses: tinlake.contractAddresses,
      contractConfig: tinlake.contractConfig,
    }

    const unconfirmedTx: Transaction<Params> = {
      id,
      description,
      actionName,
      args,
      tinlakeConfig,
      status: 'pending',
      showIfClosed: true,
    }
    dispatch({ id, transaction: unconfirmedTx, type: QUEUE_TRANSACTION })

    if (!getState().asyncTransactions.processing) {
      dispatch({ type: START_PROCESSING })
      dispatch(processTransaction(unconfirmedTx))
    }

    return id
  }
}

export function processTransaction<M extends TransactionAction>(
  unconfirmedTx: Transaction<M>
): ThunkAction<Promise<void>, { asyncTransactions: TransactionState }, undefined, Action> {
  return async (dispatch, getState) => {
    // Dequeue
    const id = unconfirmedTx.id
    dispatch({ id, transaction: unconfirmedTx, type: DEQUEUE_TRANSACTION })
    dispatch({ id, transaction: unconfirmedTx, type: SET_ACTIVE_TRANSACTION })

    // Start transaction
    const tinlake = initTinlake(unconfirmedTx.tinlakeConfig)

    const outcomeTx: Transaction<M> = {
      ...unconfirmedTx,
      showIfClosed: true,
    }

    try {
      const actionCall = actions[unconfirmedTx.actionName]
      const response = await (actionCall as any)(tinlake, ...unconfirmedTx.args as any[])
      // const response = await actions[unconfirmedTx.actionName](tinlake, unconfirmedTx.args)

      // TODO: link to tinlake.js for checking whether transaction has been confirmed yet
      // const pendingTx: Transaction = {
      //   ...unconfirmedTx,
      //   status: 'pending',
      //   showIfClosed: true
      // }
      // await dispatch({ id, transaction: pendingTx, type: SET_ACTIVE_TRANSACTION })

      const outcome = (response as any).status === SUCCESS_STATUS
      outcomeTx.status = outcome ? 'succeeded' : 'failed'
    } catch (error) {
      console.error('error response', error)
      outcomeTx.status = 'failed'
    }

    await dispatch({ id, transaction: outcomeTx, type: SET_ACTIVE_TRANSACTION })

    // Hide after 5s
    setTimeout(async () => {
      const hiddenTx: Transaction<M> = {
        ...outcomeTx,
        showIfClosed: false,
      }
      await dispatch({ id, transaction: hiddenTx, type: SET_ACTIVE_TRANSACTION })
    }, 5000)

    // Process next transaction in queue
    if (Object.keys(getState().asyncTransactions.queue).length > 0) {
      const nextTransactionId = Object.keys(getState().asyncTransactions.queue)[0]
      const nextTransaction = getState().asyncTransactions.queue[nextTransactionId]
      dispatch(processTransaction(nextTransaction))
    } else {
      dispatch({ type: STOP_PROCESSING })
    }
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
      showIfClosed: tx.showIfClosed,
    }
  })

  return transactions
}
