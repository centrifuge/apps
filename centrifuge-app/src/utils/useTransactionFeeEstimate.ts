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

  async function doTransaction(selectedAccount: WalletAccount, args: T, txOptions?: TxOptions) {
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
  }

  async function execute(args: T, options?: TxOptions) {
    if (!selectedAccount) {
      return
    }
    await doTransaction(selectedAccount, args, options)
  }

  return {
    execute,
    txFee,
  }
}
