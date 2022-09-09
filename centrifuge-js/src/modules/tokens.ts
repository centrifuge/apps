import { switchMap } from 'rxjs'
import { CurrencyBalance } from '..'
import { CentrifugeBase } from '../CentrifugeBase'

export function getTokensModule(inst: CentrifugeBase) {
  function transfer(args: [destination: string, currencyId: any, amount: CurrencyBalance]) {
    const $api = inst.getApi()
    return $api.pipe(
      switchMap((api) => {
        const submittable = api.tx.tokens.transfer(...args)
        return inst.wrapSignAndSend(api, submittable)
      })
    )
  }

  return {
    transfer,
  }
}
