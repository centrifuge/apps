import Centrifuge from '@centrifuge/centrifuge-js'
import {
  Transaction,
  useCentrifuge,
  useEvmProvider,
  useTransaction,
  useTransactions,
  useWallet,
} from '@centrifuge/centrifuge-react'
import { TransactionRequest, TransactionResponse } from '@ethersproject/providers'
import * as React from 'react'
import { Observable, lastValueFrom, tap } from 'rxjs'
import { useGmp } from '../useGmp'

export function useEvmTransaction<T extends Array<any>>(
  title: string,
  transactionCallback: (
    centrifuge: Centrifuge
  ) => (args: T, options?: TransactionRequest) => Observable<TransactionResponse>,
  options: { onSuccess?: (args: T, result: any) => void; onError?: (error: any) => void; chainId?: number } = {}
) {
  const { addOrUpdateTransaction, updateTransaction } = useTransactions()
  const { showWallets, evm, walletDialog } = useWallet()
  const { selectedAddress, chainId } = evm
  const [lastId, setLastId] = React.useState<string | undefined>(undefined)
  const lastCreatedTransaction = useTransaction(lastId)
  const centrifuge = useCentrifuge()
  const provider = useEvmProvider()
  const pendingTransaction = React.useRef<{ id: string; args: T; options?: TransactionRequest }>()
  const { setGmpHash, gmpHash } = useGmp()

  async function doTransaction(
    id: string,
    args: T,
    txOptions?: TransactionRequest,
    gmpOptions?: { poolId: string; trancheId: string }
  ) {
    try {
      const signer = provider!.getSigner()
      const connectedCent = centrifuge.connectEvm(selectedAddress!, signer)
      const transaction = transactionCallback(connectedCent)
      updateTransaction(id, { status: 'unconfirmed' })
      const lastResult = await lastValueFrom(
        transaction(args, txOptions).pipe(
          tap((result) => {
            if (!gmpHash && gmpOptions) {
              setGmpHash(result.hash, gmpOptions.poolId, gmpOptions.trancheId, selectedAddress!)
            }
            updateTransaction(id, { status: 'pending', hash: result.hash })
          })
        )
      )

      updateTransaction(id, { status: 'succeeded' })
      options.onSuccess?.(args, lastResult)
    } catch (e) {
      console.error(e)
      updateTransaction(id, { status: 'failed', failedReason: (e as Error).message, error: e })
      options.onError?.(e)
    }
  }

  function execute(args: T, options?: TransactionRequest, gmp?: { poolId: string; trancheId: string }) {
    const id = Math.random().toString(36).substring(2)
    const tx: Transaction = {
      id,
      title,
      status: 'creating',
      args,
      network: chainId,
    }
    addOrUpdateTransaction(tx)
    setLastId(id)

    if (!selectedAddress || !provider) {
      pendingTransaction.current = { id, args, options }
      showWallets(chainId ?? 1)
    } else {
      doTransaction(id, args, options, gmp)
    }
    return id
  }

  React.useEffect(() => {
    if (pendingTransaction.current) {
      const { id, args, options } = pendingTransaction.current

      if (walletDialog.view !== null || (selectedAddress && !provider)) return
      pendingTransaction.current = undefined

      if (selectedAddress && provider) {
        doTransaction(id, args, options)
      } else {
        updateTransaction(id, { status: 'failed', failedReason: 'No account connected' })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletDialog.view, provider])

  return {
    execute,
    lastCreatedTransaction,
    reset: () => setLastId(undefined),
    isLoading: lastCreatedTransaction
      ? ['creating', 'unconfirmed', 'pending'].includes(lastCreatedTransaction.status)
      : false,
  }
}
