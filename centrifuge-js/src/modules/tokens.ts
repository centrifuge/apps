import { switchMap } from 'rxjs'
import { CurrencyBalance, TransactionOptions } from '..'
import { CentrifugeBase } from '../CentrifugeBase'

export function getTokensModule(inst: CentrifugeBase) {
  function transfer(
    args: [destination: string, currencyId: any, amount: CurrencyBalance],
    options?: TransactionOptions
  ) {
    const $api = inst.getApi()
    return $api.pipe(
      switchMap((api) => {
        const submittable = api.tx.tokens.transfer(...args)
        return inst.wrapSignAndSend(api, submittable, options)
      })
    )
  }

  return {
    transfer,
  }
}
