import { ApiPromise } from '@polkadot/api'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { web3FromAddress } from '@polkadot/extension-dapp'
import { InjectedAccountWithMeta } from '@polkadot/extension-inject/types'
import * as React from 'react'
import { Transaction, useTransaction, useTransactions } from '../components/TransactionsProvider'
import { useWeb3 } from '../components/Web3Provider'
import { initPolkadotApi } from './web3'

type TransactionCallback = (
  api: ApiPromise
) => SubmittableExtrinsic<'promise'> | Promise<SubmittableExtrinsic<'promise'>>

export function useCreateTransaction() {
  const { addTransaction, updateTransaction } = useTransactions()
  const { selectedAccount, connect } = useWeb3()
  const [lastId, setLastId] = React.useState<string | undefined>(undefined)
  const lastCreatedTransaction = useTransaction(lastId)
  const pendingTransaction = React.useRef<{ id: string; args: [TransactionCallback, (() => void) | undefined] }>()

  const doTransaction = React.useCallback(
    async (
      selectedAccount: InjectedAccountWithMeta,
      id: string,
      createCallback: TransactionCallback,
      finalizedCallback?: () => void
    ) => {
      try {
        const api = await initPolkadotApi()
        const injector = await web3FromAddress(selectedAccount?.address)
        const submittable = await createCallback(api)

        updateTransaction(id, { status: 'unconfirmed' })

        return new Promise<void>((resolve, reject) => {
          submittable.signAndSend(selectedAccount.address, { signer: injector.signer }, (result) => {
            const errors = result.events.filter(({ event }) => api.events.system.ExtrinsicFailed.is(event))

            if (result.status.isFinalized) {
              updateTransaction(id, (prev) => (prev.status === 'failed' ? {} : { status: 'succeeded' }))
              resolve()
            } else if (result.dispatchError || errors.length) {
              console.error(result.dispatchError || errors)
              updateTransaction(id, { status: 'failed', failedReason: 'Transaction failed' })
              reject()
            } else {
              updateTransaction(id, { status: 'pending', hash: submittable.hash.toHex() })
            }
          })
        }).then(finalizedCallback)
      } catch (e) {
        console.error(e)
        updateTransaction(id, { status: 'failed', failedReason: (e as any).message })
      }
    },
    [updateTransaction]
  )

  const createTransaction = React.useCallback(
    (title: string, createCallback: TransactionCallback, finalizedCallback?: () => void) => {
      const id = Math.random().toString(36).substr(2)
      const tx: Transaction = {
        id,
        title,
        status: 'creating',
      }
      addTransaction(tx)
      setLastId(id)

      if (!selectedAccount) {
        pendingTransaction.current = { id, args: [createCallback, finalizedCallback] }
        connect().catch((e) => {
          updateTransaction(id, { status: 'failed', failedReason: e.message })
        })
      } else {
        doTransaction(selectedAccount, id, createCallback, finalizedCallback)
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
    reset: () => setLastId(undefined),
  }
}
