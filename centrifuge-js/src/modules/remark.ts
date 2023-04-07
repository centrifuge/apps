import { switchMap } from 'rxjs'
import { CentrifugeBase } from '../CentrifugeBase'

export function getRemarkModule(inst: CentrifugeBase) {
  function signRemark(args: [message: string]) {
    const [message] = args
    const $api = inst.getApi()
    return $api.pipe(switchMap((api) => inst.wrapSignAndSend(api, api.tx.system.remarkWithEvent(message), {})))
  }

  return {
    signRemark,
  }
}
