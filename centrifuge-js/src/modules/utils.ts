import { SubmittableExtrinsic } from '@polkadot/api/types'
import { CentrifugeBase } from '../CentrifugeBase'
import * as utilsPure from '../utils'

export function getUtilsModule(inst: CentrifugeBase) {
  // TODO: this doesn't work yet
  async function batch(submittables: Promise<any>[]) {
    const api = await inst.getApi()
    const submittable = api.tx.utility.batchAll(
      await Promise.all(submittables as unknown as SubmittableExtrinsic<'promise'>[])
    )
    return inst.wrapSignAndSend(api, submittable)
  }

  return {
    ...utilsPure,
    batch,
  }
}
