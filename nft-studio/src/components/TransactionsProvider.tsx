import * as React from 'react'

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
