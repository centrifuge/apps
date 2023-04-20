import { of, switchMap } from 'rxjs'
import { CentrifugeBase } from '../CentrifugeBase'
import { TransactionOptions } from '../types'

export function getRemarkModule(inst: CentrifugeBase) {
  function signRemark(args: [message: string], options?: TransactionOptions) {
    const [message] = args
    const $api = inst.getApi()
    return $api.pipe(switchMap((api) => inst.wrapSignAndSend(api, api.tx.system.remarkWithEvent(message), options)))
  }

  function validateRemark(blockNumber: string, txHash: string, expectedRemark: string) {
    return inst.getBlockByBlockNumber(Number(blockNumber)).pipe(
      switchMap((block) => {
        const extrinsic = block?.block.extrinsics.find((ex) => ex.hash.toString() === txHash)
        const actualRemark = extrinsic?.method.args[0].toHuman()
        if (actualRemark !== expectedRemark) {
          throw new Error('Invalid remark')
        }
        return of(true)
      })
    )
  }

  return {
    signRemark,
    validateRemark,
  }
}
