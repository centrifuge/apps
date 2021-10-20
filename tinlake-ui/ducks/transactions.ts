import Tinlake from '@centrifuge/tinlake-js'
import * as Sentry from '@sentry/react'
import { ethers } from 'ethers'
import { HYDRATE } from 'next-redux-wrapper'
import * as React from 'react'
import { useSelector } from 'react-redux'
import { Action, AnyAction } from 'redux'
import { ThunkAction } from 'redux-thunk'
import config from '../config'
import { getOnboard } from '../services/onboard'
import * as actions from '../services/tinlake/actions'

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

export type TransactionId = string
export type TransactionStatus = 'unconfirmed' | 'pending' | 'succeeded' | 'failed'

interface TinlakeConfig {
  version?: 2 | 3
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
}

const initialState: TransactionState = {
  processing: false,
  active: {},
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
    default:
      return state
  }
}

// Action creators
export function createTransaction<A extends TransactionAction>(
  description: string,
  actionName: A,
  args: Parameters<typeof actions[A]>
): ThunkAction<Promise<string>, { transactions: TransactionState }, undefined, Action> {
  return async (dispatch) => {
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

    dispatch(processTransaction(unconfirmedTx))

    return id
  }
}

function processTransaction(
  unconfirmedTx: Transaction
): ThunkAction<Promise<void>, { transactions: TransactionState }, undefined, Action> {
  return async (dispatch, getState) => {
    const id = unconfirmedTx.id
    dispatch({ id, transaction: unconfirmedTx, type: SET_ACTIVE_TRANSACTION })

    // Start transaction
    const {
      tinlakeConfig: { contractConfig, addresses },
    } = getState().transactions.active[id]
    const rpcProvider = new ethers.providers.JsonRpcProvider(config.rpcUrl)
    const tinlake = new Tinlake({ contractConfig, contractAddresses: addresses, provider: rpcProvider })
    const onboard = getOnboard()

    if (!onboard) throw new Error('Onboard not initialized')

    const { wallet } = onboard.getState()
    const web3Provider = new ethers.providers.Web3Provider(wallet.provider)
    const fallbackProvider = new ethers.providers.FallbackProvider([web3Provider, rpcProvider])
    tinlake.setProviderAndSigner(fallbackProvider, web3Provider.getSigner(), web3Provider.provider)

    const outcomeTx: Transaction = {
      ...unconfirmedTx,
      showIfClosed: true,
    }

    // This is a hack to grab a human-friendly error. We should eventually refactor Tinlake.js to return this error directly.
    const errorMessageRegex = /"message":"\s?(.*)[.?]["?],/

    try {
      const actionCall = actions[unconfirmedTx.actionName as keyof typeof actions]
      const tx = await (actionCall as any)(tinlake, ...unconfirmedTx.actionArgs)

      if (tx.hash) {
        // Confirmed
        const pendingTx: Transaction = {
          ...unconfirmedTx,
          status: 'pending',
          hash: tx.hash,
        }
        await dispatch({ id, transaction: pendingTx, dontChangeUpdatedAt: true, type: SET_ACTIVE_TRANSACTION })

        const receipt = await tinlake!.getTransactionReceipt(tx)

        const outcome = receipt.status === 1
        outcomeTx.status = outcome ? 'succeeded' : 'failed'
        outcomeTx.result = receipt
        outcomeTx.hash = receipt.transactionHash

        if (config.enableErrorLogging && outcomeTx.status === 'failed') {
          Sentry.captureMessage(`Transaction failed: ${unconfirmedTx.actionName}`, { extra: { tx: outcomeTx } })
        }
      } else if (tx.status === 1) {
        // Succeeded immediately
        outcomeTx.status = 'succeeded'
      } else {
        // Failed or rejected
        outcomeTx.status = 'failed'
        outcomeTx.failedReason = tx.error
        if (tx.transactionhash) {
          outcomeTx.hash = tx.transactionhash
        }

        if (config.enableErrorLogging) {
          Sentry.captureMessage(`Transaction failed: ${unconfirmedTx.actionName}`, { extra: { tx: outcomeTx } })
        }
      }
    } catch (error: any) {
      console.error(`Transaction error: ${unconfirmedTx.actionName})`, error)

      if (config.enableErrorLogging) {
        Sentry.captureMessage(`Transaction error: ${unconfirmedTx.actionName}): ${error.toString()}`)
      }
      outcomeTx.status = 'failed'

      if (errorMessageRegex.test(error.toString())) {
        const matches = error.toString().match(errorMessageRegex)
        if (matches) outcomeTx.failedReason = matches[1]
      }
    }

    await dispatch({ id, transaction: outcomeTx, type: SET_ACTIVE_TRANSACTION })

    const completedTxTimeout = 5000
    const hideCompletedTxCallback = async () => {
      if (!document.hidden) {
        const hiddenTx: Transaction = {
          ...outcomeTx,
          showIfClosed: false,
        }
        await dispatch({ id, transaction: hiddenTx, dontChangeUpdatedAt: true, type: SET_ACTIVE_TRANSACTION })
      } else {
        setTimeout(hideCompletedTxCallback, completedTxTimeout)
      }
    }

    // Hide succeeded/failed tx after 5s
    setTimeout(hideCompletedTxCallback, completedTxTimeout)
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
        ? `https://${
            config.network === 'Kovan' ? 'kovan.' : config.network === 'Goerli' ? 'goerli.' : ''
          }etherscan.io/tx/${tx.hash}`
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

  const tx = useSelector<{ transactions: TransactionState }, Transaction | undefined>((state) =>
    txId ? state.transactions.active[txId] : undefined
  )
  return [tx?.status, tx?.result, setTxId]
}
