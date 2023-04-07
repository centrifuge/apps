import { switchMap } from 'rxjs'
import { CentrifugeBase } from '../CentrifugeBase'
import { TransactionOptions } from '../types'

export function getRemarkModule(inst: CentrifugeBase) {
  function signRemark(args: [message: string], options?: TransactionOptions) {
    const [message] = args
    const $api = inst.getApi()
    return $api.pipe(switchMap((api) => inst.wrapSignAndSend(api, api.tx.system.remarkWithEvent(message), options)))
  }

  return {
    signRemark,
  }
}
