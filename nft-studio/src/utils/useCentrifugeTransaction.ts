import Centrifuge, { TransactionOptions } from '@centrifuge/centrifuge-js'
import { web3FromAddress } from '@polkadot/extension-dapp'
import { InjectedAccountWithMeta } from '@polkadot/extension-inject/types'
import { ISubmittableResult } from '@polkadot/types/types'
import * as React from 'react'
import { useCentrifuge } from '../components/CentrifugeProvider'
import { Transaction, useTransaction, useTransactions } from '../components/TransactionsProvider'
import { useWeb3 } from '../components/Web3Provider'

export function useCentrifugeTransaction<T extends Array<any>>(
  title: string,
  transactionCallback: (centrifuge: Centrifuge) => (args: T, options?: TransactionOptions) => Promise<any>,
  options: { onSuccess?: (args: T, result: ISubmittableResult) => void; onError?: (error: any) => void } = {}
) {
  const { addTransaction, updateTransaction } = useTransactions()
  const { selectedAccount, connect } = useWeb3()
  const cent = useCentrifuge()
  const [lastId, setLastId] = React.useState<string | undefined>(undefined)
  const lastCreatedTransaction = useTransaction(lastId)
  const pendingTransaction = React.useRef<{ id: string; args: T }>()

  async function doTransaction(selectedAccount: InjectedAccountWithMeta, id: string, args: T) {
    try {
      const injector = await web3FromAddress(selectedAccount?.address)
      const connectedCent = cent.connect(selectedAccount?.address, injector.signer)
      const api = await cent.getApi()

      const transaction = transactionCallback(connectedCent)

      updateTransaction(id, { status: 'unconfirmed' })

      let lastResult: ISubmittableResult
      await transaction(args, {
        onStatusChange: (result) => {
          lastResult = result
          const errors = result.events.filter(({ event }) => api.events.system.ExtrinsicFailed.is(event))

          if (result.dispatchError || errors.length) {
            console.error(result.dispatchError || errors)
            updateTransaction(id, { status: 'failed', failedReason: 'Transaction failed' })
          } else if (result.status.isInBlock || result.status.isFinalized) {
            updateTransaction(id, (prev) => (prev.status === 'failed' ? {} : { status: 'succeeded' }))
          } else {
            updateTransaction(id, { status: 'pending', hash: result.status.hash.toHex() })
          }
        },
      })

      options.onSuccess?.(args, lastResult!)
    } catch (e) {
      console.error(e)
      updateTransaction(id, { status: 'failed', failedReason: (e as any).message })
      options.onError?.(e)
    }
  }

  function execute(args: T) {
    const id = Math.random().toString(36).substr(2)
    const tx: Transaction = {
      id,
      title,
      status: 'creating',
    }
    addTransaction(tx)
    setLastId(id)

    if (!selectedAccount) {
      pendingTransaction.current = { id, args }
      connect().catch((e) => {
        updateTransaction(id, { status: 'failed', failedReason: e.message })
      })
    } else {
      doTransaction(selectedAccount, id, args)
    }
    return id
  }

  React.useEffect(() => {
    if (pendingTransaction.current) {
      const { id, args } = pendingTransaction.current
      pendingTransaction.current = undefined

      if (selectedAccount) {
        doTransaction(selectedAccount, id, args)
      } else {
        updateTransaction(id, { status: 'failed', failedReason: 'No accounts available' })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAccount])

  return {
    execute,
    lastCreatedTransaction,
    reset: () => setLastId(undefined),
    isLoading: lastCreatedTransaction
      ? ['creating', 'unconfirmed', 'pending'].includes(lastCreatedTransaction.status)
      : false,
  }
}
