import { switchMap } from 'rxjs'
import { CurrencyBalance, TransactionOptions } from '..'
import { CentrifugeBase } from '../CentrifugeBase'
import { CurrencyKey } from './pools'

export function getTokensModule(inst: CentrifugeBase) {
  function transfer(
    args: [
      receiverAddress: string,
      currencyKey: CurrencyKey,
      amount: CurrencyBalance,
      network?: 'centrifuge' | { evm: number }
    ],
    options?: TransactionOptions
  ) {
    const [receiverAddress, currencyKey, amount, network] = args
    const $api = inst.getApi()
    return $api.pipe(
      switchMap((api) => {
        let tx = api.tx.tokens.transfer(receiverAddress, currencyKey, amount)
        if (
          network &&
          typeof network === 'object' &&
          'evm' in network &&
          typeof currencyKey === 'object' &&
          'Tranche' in currencyKey
        ) {
          const [poolId, trancheId] = currencyKey.Tranche
          tx = api.tx.liquidityPools.transferTrancheTokens(
            poolId,
            trancheId,
            { evm: [network, receiverAddress] },
            amount
          )
        }
        return inst.wrapSignAndSend(api, tx, options)
      })
    )
  }

  return {
    transfer,
  }
}
