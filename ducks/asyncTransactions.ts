import { AnyAction, Action } from 'redux'
import { ThunkAction } from 'redux-thunk'
import { HYDRATE } from 'next-redux-wrapper'
import { ITinlake } from 'tinlake'
import { initTinlake } from '../services/tinlake'

// TODO: should be imported from @centrifuge/axis-web3-wallet
export interface WalletTransaction {
  description: string
  status: 'unconfirmed' | 'pending' | 'succeeded' | 'failed'
  txHahs: string
  externalLink?: string
  showIfClosed?: boolean
}

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

export interface Transaction {
  id: string
  description: string
  methodName: keyof ITinlake
  args: any[] // TODO: should be something like Parameters<ITinlake[methodName]>
  status: TransactionStatus
  tinlakeConfig: TinlakeConfig
  showIfClosed: boolean
}

export interface TransactionState {
  processing: boolean
  active: { [key: string]: Transaction }
  queue: { [key: string]: Transaction }
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

export function createTransaction<M extends keyof ITinlake>(
  description: string,
  tinlake: ITinlake,
  methodName: M,
  args: Parameters<ITinlake[M]>
): ThunkAction<Promise<string>, { asyncTransactions: TransactionState }, undefined, Action> {
  return async (dispatch, getState) => {
    const id: TransactionId = (new Date().getTime() + Math.floor(Math.random() * 1000000)).toString()

    const tinlakeConfig = {
      addresses: tinlake.contractAddresses,
      contractConfig: tinlake.contractConfig,
    }

    const unconfirmedTx: Transaction = {
      id,
      description,
      methodName,
      args,
      tinlakeConfig,
      status: 'unconfirmed',
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

export function processTransaction(
  unconfirmedTx: Transaction
): ThunkAction<Promise<void>, { asyncTransactions: TransactionState }, undefined, Action> {
  return async (dispatch, getState) => {
    // Dequeue
    const id = unconfirmedTx.id
    dispatch({ id, transaction: unconfirmedTx, type: DEQUEUE_TRANSACTION })
    dispatch({ id, transaction: unconfirmedTx, type: SET_ACTIVE_TRANSACTION })

    // Start transaction
    const tinlake = initTinlake(unconfirmedTx.tinlakeConfig)
    const response = await tinlake[unconfirmedTx.methodName](...unconfirmedTx.args)

    // TODO: link to tinlake.js for checking whether transaction has been confirmed yet
    // const pendingTx: Transaction = {
    //   ...unconfirmedTx,
    //   status: 'pending',
    //   showIfClosed: true
    // }
    // await dispatch({ id, transaction: pendingTx, type: SET_ACTIVE_TRANSACTION })

    // Check response
    const outcome = (response as any).status === SUCCESS_STATUS

    const outcomeTx: Transaction = {
      ...unconfirmedTx,
      status: outcome ? 'succeeded' : 'failed',
      showIfClosed: true,
    }
    await dispatch({ id, transaction: outcomeTx, type: SET_ACTIVE_TRANSACTION })

    // Hide after 5s
    setTimeout(async () => {
      const hiddenTx: Transaction = {
        ...outcomeTx,
        showIfClosed: false,
      }
      await dispatch({ id, transaction: hiddenTx, type: SET_ACTIVE_TRANSACTION })
    }, 5000)

    // Start the next transaction in the queue

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
