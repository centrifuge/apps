import Centrifuge, { TransactionOptions } from '@centrifuge/centrifuge-js'
import { useCentrifuge, useEvmProvider, useWallet } from '@centrifuge/centrifuge-react'
import Decimal from 'decimal.js-light'
import * as React from 'react'
import { lastValueFrom, Observable } from 'rxjs'
import { useAddress } from './useAddress'

type TxOptions = Pick<TransactionOptions, 'paymentInfo'>

export function useTransactionFeeEstimate<T extends Array<any>>(
  transactionCallback: (centrifuge: Centrifuge) => (args: T, options: TransactionOptions) => Observable<any>
) {
  const { selectedAccount } = useWallet().substrate
  const address = useAddress()
  const provider = useEvmProvider()
  const cent = useCentrifuge()
  const [txFee, setTxFee] = React.useState<Decimal | undefined>(undefined)

  const doTransaction = React.useCallback(async (address: string, signer: any, args: T, txOptions?: TxOptions) => {
    try {
      const connectedCent = cent.connect(address, signer as any)
      const transaction = transactionCallback(connectedCent)

      const lastResult = await lastValueFrom(
        transaction(args, {
          paymentInfo: address,
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
      if (!address) {
        console.error('No wallet')
        return
      }
      const signer = selectedAccount?.signer || provider
      await doTransaction(address, signer, args, options)
    },
    [doTransaction, selectedAccount, address]
  )

  return {
    execute,
    txFee,
  }
}
