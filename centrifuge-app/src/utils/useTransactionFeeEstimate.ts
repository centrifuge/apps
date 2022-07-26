import Centrifuge, { TransactionOptions } from '@centrifuge/centrifuge-js'
import { WalletAccount } from '@talisman-connect/wallets'
import * as React from 'react'
import { lastValueFrom, Observable } from 'rxjs'
import { useCentrifuge } from '../components/CentrifugeProvider'
import { useWeb3 } from '../components/Web3Provider'

type TxOptions = Pick<TransactionOptions, 'paymentInfo'>

export function useTransactionFeeEstimate<T extends Array<any>>(
  transactionCallback: (centrifuge: Centrifuge) => (args: T, options: TransactionOptions) => Observable<any>
) {
  const { selectedAccount } = useWeb3()
  const cent = useCentrifuge()
  const [txFee, setTxFee] = React.useState<number | undefined>(undefined)

  const doTransaction = React.useCallback(async (selectedAccount: WalletAccount, args: T, txOptions?: TxOptions) => {
    try {
      const connectedCent = cent.connect(selectedAccount?.address, selectedAccount?.signer as any)
      const transaction = transactionCallback(connectedCent)

      const lastResult = await lastValueFrom(
        transaction(args, {
          paymentInfo: selectedAccount.address,
          ...txOptions,
        })
      )
      const txFee = lastResult.partialFee.toDecimal()
      setTxFee(txFee)
    } catch (e) {
      console.error(e)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const execute = React.useCallback(
    async (args: T, options?: TxOptions) => {
      if (!selectedAccount) {
        return
      }
      await doTransaction(selectedAccount, args, options)
    },
    [doTransaction, selectedAccount]
  )

  return {
    execute,
    txFee,
  }
}
