import Centrifuge, { TransactionOptions } from '@centrifuge/centrifuge-js'
import { web3FromAddress } from '@polkadot/extension-dapp'
import { InjectedAccountWithMeta } from '@polkadot/extension-inject/types'
import { ISubmittableResult } from '@polkadot/types/types'
import * as React from 'react'
import { lastValueFrom, Observable } from 'rxjs'
import { useCentrifuge } from '../components/CentrifugeProvider'
import { Transaction, useTransaction, useTransactions } from '../components/TransactionsProvider'
import { useWeb3 } from '../components/Web3Provider'
import { PalletError } from './errors'

export function useCentrifugeTransaction<T extends Array<any>>(
  title: string,
  transactionCallback: (centrifuge: Centrifuge) => (args: T, options?: TransactionOptions) => Observable<any>,
  options: { onSuccess?: (args: T, result: ISubmittableResult) => void; onError?: (error: any) => void } = {}
) {
  const { addTransaction, updateTransaction } = useTransactions()
  const { selectedAccount, connect, proxy } = useWeb3()
  const cent = useCentrifuge()
  const [lastId, setLastId] = React.useState<string | undefined>(undefined)
  const lastCreatedTransaction = useTransaction(lastId)
  const pendingTransaction = React.useRef<{ id: string; args: T }>()

  async function doTransaction(selectedAccount: InjectedAccountWithMeta, id: string, args: T) {
    try {
      const injector = await web3FromAddress(selectedAccount?.address)
      const connectedCent = cent.connect(selectedAccount?.address, injector.signer)
      if (proxy) {
        connectedCent.setProxy(proxy.delegator)
      }
      const api = await cent.getApiPromise()

      const transaction = transactionCallback(connectedCent)

      updateTransaction(id, { status: 'unconfirmed' })

      let txError: any = null
      const lastResult = await lastValueFrom(
        transaction(args, {
          onStatusChange: (result) => {
            const errors = result.events.filter(({ event }) => api.events.system.ExtrinsicFailed.is(event))
            let errorObject: any

            if (result.dispatchError || errors.length) {
              let errorMessage = 'Transaction failed'
              txError = result.dispatchError || errors[0]
              if (errors.length) {
                const error = errors[0].event.data[0] as any
                if (error.isModule) {
                  // for module errors, we have the section indexed, lookup
                  const decoded = api.registry.findMetaError(error.asModule)
                  const { section, method, docs } = decoded
                  errorObject = new PalletError(section, method)
                  errorMessage = errorObject.message || errorMessage
                  console.error(`${section}.${method}: ${docs.join(' ')}`)
                } else {
                  // Other, CannotLookup, BadOrigin, no extra info
                  console.error(error.toString())
                }
              }

              updateTransaction(id, (prev) => ({
                status: 'failed',
                failedReason: errorMessage,
                error: errorObject,
                dismissed: prev.status === 'failed' && prev.dismissed,
              }))
            } else if (result.status.isInBlock || result.status.isFinalized) {
              updateTransaction(id, (prev) =>
                prev.status === 'failed'
                  ? {}
                  : { status: 'succeeded', dismissed: prev.status === 'succeeded' && prev.dismissed }
              )
            } else {
              updateTransaction(id, { status: 'pending', hash: result.status.hash.toHex() })
            }
          },
        })
      )

      if (txError) {
        options.onError?.(txError)
      } else {
        options.onSuccess?.(args, lastResult)
      }
    } catch (e) {
      console.error(e)
      updateTransaction(id, { status: 'failed', failedReason: 'Failed to submit transaction' })
      options.onError?.(e)
    }
  }

  function execute(args: T) {
    const id = Math.random().toString(36).substr(2)
    const tx: Transaction = {
      id,
      title,
      status: 'creating',
      args,
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
