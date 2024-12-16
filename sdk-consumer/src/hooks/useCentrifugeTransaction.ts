import { OperationConfirmedStatus, Transaction } from '@centrifuge/sdk'
import * as React from 'react'
import { lastValueFrom, tap } from 'rxjs'
import { useTransactions } from '../components/Transactions/TransactionsProvider'
import { useVaults } from './usePool'

export type CentrifugeTransactionOptions = {
  onSuccess?: (args: any[], result: OperationConfirmedStatus) => void
  onError?: (error: any) => void
}

function Comp() {
  const { data: vaults } = useVaults('2779829532', '0xac6bffc5fd68f7772ceddec7b0a316ca', 11155111)
  const { execute, isLoading } = useCentrifugeTransaction()

  async function submit() {
    const vault = vaults?.[0]!
    execute(vault.increaseInvestOrder(100))
  }
}

export function useCentrifugeTransaction() {
  const { updateTransaction, addTransaction } = useTransactions()
  const [status, setStatus] = React.useState<'idle' | 'loading' | 'success' | 'error'>()

  async function execute(observable: Transaction) {
    setStatus('loading')
    let lastId = ''
    try {
      const lastResult = await lastValueFrom(
        observable.pipe(
          tap((result) => {
            switch (result.type) {
              case 'SigningTransaction':
                lastId = Math.random().toString(36).slice(2)
                addTransaction({
                  id: lastId,
                  title: result.title,
                  status: 'unconfirmed',
                })
                break
              case 'TransactionPending':
                updateTransaction(lastId, {
                  status: 'pending',
                })
                break
              case 'TransactionConfirmed':
                updateTransaction(lastId, {
                  status: 'succeeded',
                  result: result.receipt,
                })
            }
          })
        )
      )
      return (lastResult as OperationConfirmedStatus).receipt
    } catch (e) {
      if (lastId) {
        updateTransaction(lastId, {
          status: 'failed',
          error: e,
        })
        setStatus('error')
      }
      throw e
    }
  }

  return {
    execute,
    reset: () => setStatus('idle'),
    isLoading: status === 'loading',
  }
}
