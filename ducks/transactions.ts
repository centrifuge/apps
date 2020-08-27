import * as React from 'react'
import { AnyAction, Action } from 'redux'
import { useSelector } from 'react-redux'
import { ThunkAction } from 'redux-thunk'
import { HYDRATE } from 'next-redux-wrapper'
import { initTinlake } from '../services/tinlake'
import * as actions from '../services/tinlake/actions'

import config from '../config'

// TODO: should be imported from @centrifuge/axis-web3-wallet
export interface WalletTransaction {
  description: string
  status: 'unconfirmed' | 'pending' | 'succeeded' | 'failed'
  externalLink?: string
  showIfClosed?: boolean
  failedReason?: string
}

// This refers to any function in ../services/tinlake/actions which aligns to the TinlakeAction type
export type TransactionAction = {
  [P in keyof typeof actions]: typeof actions[P] extends actions.TinlakeAction ? P : never
}[keyof typeof actions]

// Can be extended by components which create and subscribe to transactions
export interface TransactionProps {
  createTransaction: <A extends TransactionAction>(
    description: string,
    actionName: A,
    args: Parameters<typeof actions[A]>
  ) => Promise<string>
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
  actionName: TransactionAction
  actionArgs: any[]
  hash?: string
  status: TransactionStatus
  result?: any
  tinlakeConfig: TinlakeConfig
  showIfClosed: boolean
  failedReason?: string
  updatedAt?: number
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
          [action.id]: {
            ...action.transaction,
            updatedAt: new Date().getTime(),
          },
        },
      }
    case QUEUE_TRANSACTION:
      return {
        ...state,
        queue: {
          ...state.queue,
          [action.id]: {
            ...action.transaction,
            updatedAt: new Date().getTime(),
          },
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

// Action creators
const SUCCESS_STATUS = '0x1'

export function createTransaction<A extends TransactionAction>(
  description: string,
  actionName: A,
  args: Parameters<typeof actions[A]>
): ThunkAction<Promise<string>, { transactions: TransactionState }, undefined, Action> {
  return async (dispatch, getState) => {
    // Generate a unique id
    const id: TransactionId = (new Date().getTime() + Math.floor(Math.random() * 1000000)).toString()

    /**
     * We store the tinlake config, remove the tinlake service from the state (as it's not serializable and can therefore not be stored in Redux state),
     * and then re-initialize Tinlake.js with the same config when processing the transaction.
     * */
    const tinlakeConfig = {
      addresses: args[0].contractAddresses,
      contractConfig: args[0].contractConfig,
    }

    const actionArgs = args.slice(1)

    const unconfirmedTx: Transaction = {
      id,
      description,
      actionName,
      actionArgs,
      tinlakeConfig,
      status: 'unconfirmed',
      showIfClosed: true,
    }
    dispatch({ id, transaction: unconfirmedTx, type: QUEUE_TRANSACTION })

    // Start processing this transaction if no transaction is currently being processed
    if (!getState().transactions.processing) {
      dispatch({ type: START_PROCESSING })
      dispatch(processTransaction(unconfirmedTx))
    }

    return id
  }
}

export function processTransaction(
  unconfirmedTx: Transaction
): ThunkAction<Promise<void>, { transactions: TransactionState }, undefined, Action> {
  return async (dispatch, getState) => {
    // Dequeue
    const id = unconfirmedTx.id
    dispatch({ id, transaction: unconfirmedTx, type: DEQUEUE_TRANSACTION })
    dispatch({ id, transaction: unconfirmedTx, type: SET_ACTIVE_TRANSACTION })
    let hasCompleted = false

    // Start transaction
    const tinlake = initTinlake(unconfirmedTx.tinlakeConfig)

    const outcomeTx: Transaction = {
      ...unconfirmedTx,
      showIfClosed: true,
    }

    // This is a hack to grab a human-friendly error. We should eventually refactor Tinlake.js to return this error directly.
    const errorMessageRegex = /\"message\"\:\"\s?(.*)[\.?][\"?],/

    try {
      const actionCall = actions[unconfirmedTx.actionName as keyof typeof actions]
      const tx = await (actionCall as any)(tinlake, ...unconfirmedTx.actionArgs)

      console.log('Transaction', tx)

      if (tx.hash) {
        // Confirmed
        const pendingTx: Transaction = {
          ...unconfirmedTx,
          status: 'pending',
          hash: tx.hash
        }
        await dispatch({ id, transaction: pendingTx, dontChangeUpdatedAt: true, type: SET_ACTIVE_TRANSACTION })

        // Hide pending tx after 10s
        setTimeout(async () => {
          if (!hasCompleted) {
            const hiddenPendingTx: Transaction = {
              ...pendingTx,
              showIfClosed: false,
            }
            await dispatch({
              id,
              transaction: hiddenPendingTx,
              dontChangeUpdatedAt: true,
              type: SET_ACTIVE_TRANSACTION,
            })
          }
        }, 10000)

        const receipt = await tinlake.getTransactionReceipt(tx)
        console.log('Receipt', receipt)

        hasCompleted = true

        const outcome = receipt.status === 1
        outcomeTx.status = outcome ? 'succeeded' : 'failed'
        outcomeTx.result = receipt
      } else {
        // Failed or rejected
        hasCompleted = true
        outcomeTx.status = 'failed'
        outcomeTx.failedReason = tx.error?.message || tx.message
        if (tx.result?.transactionHash) outcomeTx.hash = tx.result.transactionHash
      }
    } catch (error) {
      console.error(
        `Failed to process action ${unconfirmedTx.actionName}(${unconfirmedTx.actionArgs.join(',')})`,
        error
      )

      outcomeTx.status = 'failed'

      if (errorMessageRegex.test(error.toString())) {
        const matches = error.toString().match(errorMessageRegex)
        if (matches) outcomeTx.failedReason = matches[1]
      }
    }

    await dispatch({ id, transaction: outcomeTx, type: SET_ACTIVE_TRANSACTION })

    // Hide succeeded/failed tx after 5s
    setTimeout(async () => {
      // TODO: this shouldn't update the 'updatedAt' property, since it pushes up transactions which haven't actually changed
      const hiddenTx: Transaction = {
        ...outcomeTx,
        showIfClosed: false,
      }
      await dispatch({ id, transaction: hiddenTx, dontChangeUpdatedAt: true, type: SET_ACTIVE_TRANSACTION })
    }, 5000)

    // Process next transaction in queue
    if (Object.keys(getState().transactions.queue).length > 0) {
      const nextTransactionId = Object.keys(getState().transactions.queue)[0]
      const nextTransaction = getState().transactions.queue[nextTransactionId]
      dispatch(processTransaction(nextTransaction))
    } else {
      dispatch({ type: STOP_PROCESSING })
    }
  }
}

// Selectors
const sortByMostRecent = (a: Transaction, b: Transaction) =>
  a.updatedAt && b.updatedAt ? b.updatedAt - a.updatedAt : 0

export function selectWalletTransactions(state?: TransactionState): WalletTransaction[] {
  if (!state) return []

  // Retrieve active transactions, sort them by most recent, and then convert them into the type required for the wallet
  const transactions: WalletTransaction[] = Object.keys(state.active)
    .map((id: string) => state.active[id])
    .sort(sortByMostRecent)
    .map((tx: Transaction) => {
      const externalLink = tx.hash
        ? `https://${config.network === 'Kovan' ? 'kovan.' : ''}etherscan.io/tx/${tx.hash}`
        : undefined

      return {
        externalLink,
        description: tx.description,
        status: tx.status,
        showIfClosed: tx.showIfClosed,
        failedReason: tx.failedReason,
      }
    })

  return transactions
}

export function getTransaction(state?: TransactionState, txId?: TransactionId): Transaction | undefined {
  if (!state || !txId || !(txId in state.active)) return undefined
  return state.active[txId]
}

// Hooks
export const useTransactionState = (): [TransactionStatus | undefined, any, (txId: TransactionId) => void] => {
  const [txId, setTxId] = React.useState<TransactionId | undefined>(undefined)

  const tx = useSelector((state: { transactions: TransactionState }) =>
    txId ? state.transactions.active[txId] : undefined
  )
  return [tx?.status, tx?.result, setTxId]
}
