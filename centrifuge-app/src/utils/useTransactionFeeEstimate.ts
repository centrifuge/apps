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
  const { selectedAccount, proxy } = useWeb3()
  const cent = useCentrifuge()
  const [txFee, setTxFee] = React.useState<number | undefined>(undefined)

  async function doTransaction(selectedAccount: WalletAccount, args: T, txOptions?: TxOptions) {
    try {
      const connectedCent = cent.connect(selectedAccount?.address, selectedAccount?.signer as any)
      if (proxy) {
        connectedCent.setProxy(proxy.delegator)
      }
      const api = await cent.getApiPromise()
      const transaction = transactionCallback(connectedCent)

      const lastResult = await lastValueFrom(
        transaction(args, {
          paymentInfo: selectedAccount.address,
          ...txOptions,
        })
      )

      const txFee = Number(lastResult.partialFee.toString()) / 10 ** (api.registry.chainDecimals as any)
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
