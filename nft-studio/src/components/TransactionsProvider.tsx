import { ApiPromise } from '@polkadot/api'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { web3FromAddress } from '@polkadot/extension-dapp'
import { InjectedAccountWithMeta } from '@polkadot/extension-inject/types'
import * as React from 'react'
import { initPolkadotApi } from '../utils/web3'
import { useWeb3 } from './Web3Provider'

export type TransactionStatus = 'unconfirmed' | 'pending' | 'succeeded' | 'failed'
export type Transaction = {
  id: string
  description: string
  status: TransactionStatus
  hash?: string
  result?: any
  failedReason?: string
  dismissed?: boolean
}

type TransactionsContextType = {
  transactions: Transaction[]
  addTransaction: (tx: Transaction) => void
  updateTransaction: (id: string, update: Partial<Transaction>) => void
}

const TransactionsContext = React.createContext<TransactionsContextType>(null as any)

export const TransactionProvider: React.FC = ({ children }) => {
  const [transactions, setTransactions] = React.useState<Transaction[]>([])

  console.log('transactions', transactions)

  const addTransaction = React.useCallback((tx: Transaction) => {
    setTransactions((prev) => [...prev, tx])
  }, [])

  const updateTransaction = React.useCallback((id: string, update: Partial<Transaction>) => {
    setTransactions((prev) => prev.map((tx) => (tx.id === id ? { ...tx, ...update } : tx)))
  }, [])

  const ctx: TransactionsContextType = React.useMemo(
    () => ({
      transactions,
      addTransaction,
      updateTransaction,
    }),
    [transactions, addTransaction, updateTransaction]
  )

  return <TransactionsContext.Provider value={ctx}>{children}</TransactionsContext.Provider>
}

export function useTransactions() {
  const ctx = React.useContext(TransactionsContext)
  if (!ctx) throw new Error('useTransactions must be used within TransactionProvider')
  return ctx
}

export function useTransaction(id?: string) {
  const { transactions } = useTransactions()
  return id ? transactions.find((tx) => tx.id === id) : null
}

type TransactionArgs = [string, (api: ApiPromise) => SubmittableExtrinsic<'promise'>]

export function useCreateTransaction() {
  const { addTransaction, updateTransaction } = useTransactions()
  const { selectedAccount, connect } = useWeb3()
  const [lastId, setLastId] = React.useState<string | undefined>(undefined)
  const lastCreatedTransaction = useTransaction(lastId)
  const pendingTransaction = React.useRef<{ id: string; args: TransactionArgs }>()

  const doTransaction = React.useCallback(
    async (selectedAccount: InjectedAccountWithMeta, id: string, ...args: TransactionArgs) => {
      try {
        const [, callback] = args

        const api = await initPolkadotApi()
        const injector = await web3FromAddress(selectedAccount?.address)
        const submittable = callback(api)

        await submittable.signAndSend(selectedAccount.address, { signer: injector.signer }, (status) => {
          console.log('status', status)
        })
      } catch (e) {
        updateTransaction(id, { status: 'failed', failedReason: (e as any).message })
      }
    },
    [updateTransaction]
  )

  const createTransaction = React.useCallback(
    (description: TransactionArgs[0], callback: TransactionArgs[1]) => {
      const id = Math.random().toString(36).substr(2)
      const tx: Transaction = {
        id,
        description,
        status: 'unconfirmed',
      }
      addTransaction(tx)
      setLastId(id)

      if (!selectedAccount) {
        pendingTransaction.current = { id, args: [description, callback] }
        connect().catch((e) => {
          updateTransaction(id, { status: 'failed', failedReason: e.message })
        })
      } else {
        doTransaction(selectedAccount, id, description, callback)
      }
      return id
    },
    [addTransaction, updateTransaction, selectedAccount, connect, doTransaction]
  )

  React.useEffect(() => {
    if (pendingTransaction.current) {
      const { id, args } = pendingTransaction.current
      pendingTransaction.current = undefined

      if (selectedAccount) {
        doTransaction(selectedAccount, id, ...args)
      } else {
        updateTransaction(id, { status: 'failed', failedReason: 'No accounts available' })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAccount])

  return {
    createTransaction,
    lastCreatedTransaction,
  }
}
