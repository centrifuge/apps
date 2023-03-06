import * as React from 'react'
import { Network } from '../WalletProvider/types'

export type TransactionStatus = 'creating' | 'unconfirmed' | 'pending' | 'succeeded' | 'failed'
export type Transaction = {
  args: any[]
  id: string
  title: string
  status: TransactionStatus
  hash?: string
  result?: any
  failedReason?: string
  error?: any
  dismissed?: boolean
  network?: Network
}

type TransactionsContextType = {
  transactions: Transaction[]
  addTransaction: (tx: Transaction) => void
  addOrUpdateTransaction: (tx: Transaction) => void
  updateTransaction: (id: string, update: Partial<Transaction> | ((prev: Transaction) => Partial<Transaction>)) => void
}

const TransactionsContext = React.createContext<TransactionsContextType>(null as any)

type TransactionProviderProps = {
  children: React.ReactNode
}

export function TransactionProvider({ children }: TransactionProviderProps) {
  const [transactions, setTransactions] = React.useState<Transaction[]>([])

  const addTransaction = React.useCallback((tx: Transaction) => {
    setTransactions((prev) => [...prev, tx])
  }, [])

  const updateTransaction = React.useCallback(
    (id: string, update: Partial<Transaction> | ((prev: Transaction) => Partial<Transaction>)) => {
      setTransactions((prev) =>
        prev.map((tx) =>
          tx.id === id ? { ...tx, dismissed: false, ...(typeof update === 'function' ? update(tx) : update) } : tx
        )
      )
    },
    []
  )

  const addOrUpdateTransaction = React.useCallback((tx: Transaction) => {
    setTransactions((prev) => {
      if (prev.find((t) => t.id === tx.id)) {
        return prev.map((t) => (t.id === tx.id ? { ...t, dismissed: false, ...tx } : t))
      }
      return [...prev, tx]
    })
  }, [])

  const ctx: TransactionsContextType = React.useMemo(
    () => ({
      transactions,
      addTransaction,
      updateTransaction,
      addOrUpdateTransaction,
    }),
    [transactions, addTransaction, updateTransaction, addOrUpdateTransaction]
  )

  return <TransactionsContext.Provider value={ctx}>{children}</TransactionsContext.Provider>
}

export function useTransactions() {
  const ctx = React.useContext(TransactionsContext)
  if (!ctx) throw new Error('useTransactions must be used within Provider')
  return ctx
}

export function useTransaction(id?: string) {
  const { transactions } = useTransactions()
  return id ? transactions.find((tx) => tx.id === id) : null
}
