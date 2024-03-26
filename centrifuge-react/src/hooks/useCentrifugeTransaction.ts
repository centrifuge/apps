import Centrifuge, { TransactionOptions, TransactionSuccessResult, wrapProxyCalls } from '@centrifuge/centrifuge-js'
import { ApiRx } from '@polkadot/api'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { ISubmittableResult } from '@polkadot/types/types'
import * as React from 'react'
import { Observable, lastValueFrom } from 'rxjs'
import { useCentrifuge } from '../components/CentrifugeProvider'
import { Transaction, useTransaction, useTransactions } from '../components/Transactions'
import {
  CombinedSubstrateAccount,
  Proxy,
  SubstrateAccount,
  useEvmProvider,
  useWallet,
} from '../components/WalletProvider'
import { PalletError } from '../utils/errors'

export type CentrifugeTransactionOptions = Partial<Pick<TransactionOptions, 'createType'>> & {
  account?: CombinedSubstrateAccount
  // If a transaction can be done via a proxy other than Any, pass the allowed types here,
  // to make sure the transaction selects the right one.
  // Otherwise by default it will try the transaction with the Any proxy type
  forceProxyType?: string | string[]
}

export function useCentrifugeTransaction<T extends Array<any>>(
  title: string,
  transactionCallback: (centrifuge: Centrifuge) => (args: T, options?: TransactionOptions) => Observable<any>,
  options: { onSuccess?: (args: T, result: TransactionSuccessResult) => void; onError?: (error: any) => void } = {}
) {
  const { addOrUpdateTransaction, updateTransaction } = useTransactions()
  const { showWallets, substrate, walletDialog, evm, isEvmOnSubstrate } = useWallet()
  const provider = useEvmProvider()
  const { selectedCombinedAccount, selectedAccount } = substrate
  const cent = useCentrifuge()
  const [lastId, setLastId] = React.useState<string | undefined>(undefined)
  const lastCreatedTransaction = useTransaction(lastId)
  const pendingTransaction = React.useRef<{ id: string; args: T; options?: CentrifugeTransactionOptions }>()

  async function doTransaction(
    selectedCombinedAccount: CombinedSubstrateAccount | null,
    selectedAccount: SubstrateAccount,
    id: string,
    args: T,
    txOptions?: CentrifugeTransactionOptions
  ) {
    const account = selectedCombinedAccount ||
      txOptions?.account || {
        signingAccount: selectedAccount,
        multisig: undefined,
        proxies: undefined,
      }
    try {
      let connectedCent
      if (isEvmOnSubstrate) {
        connectedCent = cent.connectEvm(evm.selectedAddress!, provider!.getSigner(), substrate.evmChainId!)
      } else {
        connectedCent = cent.connect(account.signingAccount?.address, account.signingAccount?.signer as any)
      }
      const api = await cent.getApiPromise()

      const transaction = transactionCallback(connectedCent)

      updateTransaction(id, { status: 'unconfirmed' })

      let txError: any = null
      const lastResult = await lastValueFrom(
        transaction(args, {
          multisig: account.multisig,
          proxies: account.proxies && getTypePerProxyCall(account.proxies, txOptions?.forceProxyType),
          ...txOptions,
          onStatusChange: (result) => {
            const errors = result.events.filter(({ event }) => {
              const possibleProxyErr = event.data[0]?.toHuman()
              return (
                api.events.system.ExtrinsicFailed.is(event) ||
                (api.events.proxy.ProxyExecuted.is(event) &&
                  possibleProxyErr &&
                  typeof possibleProxyErr === 'object' &&
                  'Err' in possibleProxyErr)
              )
            })
            let errorObject: any

            const { data } = result

            if (result.error) {
              txError = result.error
              let errorMessage = 'Transaction failed'
              if (isSubstrateResult(data)) {
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
              } else {
                console.error(result.error)
              }

              updateTransaction(id, (prev) => ({
                status: 'failed',
                failedReason: errorMessage,
                error: errorObject,
                dismissed: prev.status === 'failed' && prev.dismissed,
              }))
            } else if (['InBlock', 'Finalized'].includes(result.status)) {
              updateTransaction(id, (prev) =>
                prev.status === 'failed'
                  ? {}
                  : { status: 'succeeded', dismissed: prev.status === 'succeeded' && prev.dismissed }
              )
            } else {
              updateTransaction(id, { status: 'pending', hash: result.txHash })
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

      updateTransaction(id, { status: 'failed', failedReason: (e as Error).message })
      options.onError?.(e)
    }
  }

  function execute(args: T, options?: CentrifugeTransactionOptions, idOverride?: string) {
    const id = idOverride ?? Math.random().toString(36).substr(2)
    const tx: Transaction = {
      id,
      title,
      status: 'creating',
      args,
      network: 'centrifuge',
    }
    addOrUpdateTransaction(tx)
    setLastId(id)

    if (!selectedAccount && !isEvmOnSubstrate) {
      pendingTransaction.current = { id, args, options }
      showWallets('centrifuge')
    } else {
      doTransaction(selectedCombinedAccount, selectedAccount!, id, args, options)
    }
    return id
  }

  React.useEffect(() => {
    if (pendingTransaction.current) {
      const { id, args, options } = pendingTransaction.current

      if (walletDialog.view !== null) return
      pendingTransaction.current = undefined

      if (selectedAccount || isEvmOnSubstrate) {
        doTransaction(selectedCombinedAccount, selectedAccount!, id, args, options)
      } else {
        updateTransaction(id, { status: 'failed', failedReason: 'No account connected' })
      }
    }
  }, [walletDialog.view])

  return {
    execute,
    lastCreatedTransaction,
    reset: () => setLastId(undefined),
    isLoading: lastCreatedTransaction
      ? ['creating', 'unconfirmed', 'pending'].includes(lastCreatedTransaction.status)
      : false,
  }
}

function isSubstrateResult(data: any): data is ISubmittableResult {
  return 'toHuman' in data
}

export function wrapProxyCallsForAccount(
  api: ApiRx,
  tx: SubmittableExtrinsic<'rxjs'>,
  account: CombinedSubstrateAccount,
  forceProxyType: string | string[] | undefined
) {
  return wrapProxyCalls(api, tx, getTypePerProxyCall(account.proxies || [], forceProxyType))
}

export function getTypePerProxyCall(accountProxies: Proxy[], forceProxyType: string | string[] | undefined) {
  return accountProxies.map(
    (p) =>
      [
        p.delegator,
        forceProxyType
          ? (Array.isArray(forceProxyType) ? forceProxyType : [forceProxyType]).find((type) => p.types.includes(type))
          : undefined,
      ] as [string, string | undefined]
  )
}
