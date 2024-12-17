import { OperationConfirmedStatus, Transaction } from '@centrifuge/sdk'
import { useState } from 'react'
import { lastValueFrom, tap } from 'rxjs'
import { useConnectorClient } from 'wagmi'
import { centrifuge } from '../centrifuge'
import { useTransactions } from '../components/Transactions/TransactionsProvider'

export type CentrifugeTransactionOptions = {
  onSuccess?: (args: any[], result: OperationConfirmedStatus) => void
  onError?: (error: any) => void
}

export function useCentrifugeTransaction() {
  const { updateTransaction, addTransaction } = useTransactions()
  const { data: client } = useConnectorClient()
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  async function execute(observable: Transaction) {
    setStatus('loading')
    centrifuge.setSigner(client!)
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
      setStatus('success')
      return (lastResult as OperationConfirmedStatus).receipt
    } catch (e) {
      setStatus('error')
      if (lastId) {
        updateTransaction(lastId, {
          status: 'failed',
          error: e,
        })
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
