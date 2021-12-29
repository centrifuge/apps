import { SubmittableExtrinsic } from '@polkadot/api/types'
import BN from 'bn.js'
import Decimal from 'decimal.js-light'
import { CentrifugeBase } from '../CentrifugeBase'

Decimal.set({
  precision: 28,
  toExpNeg: -7,
  toExpPos: 29,
  rounding: Decimal.ROUND_HALF_CEIL,
})

const secondsPerYear = new Decimal(60 * 60 * 24 * 365)

export function getUtilsModule(inst: CentrifugeBase) {
  function toRate(rate: number) {
    return new BN(rate * 10 ** 6).mul(new BN(10).pow(new BN(27 - 6))).toString()
  }

  function aprToFee(apr: number) {
    const i = new Decimal(apr)
    const fee = i.div(secondsPerYear).plus(1).mul('1e27').toDecimalPlaces(0)
    return fee.toString()
  }

  // TODO: this doesn't work yet
  async function batch(submittables: Promise<any>[]) {
    const api = await inst.getApi()
    const submittable = api.tx.utility.batchAll(
      await Promise.all(submittables as unknown as SubmittableExtrinsic<'promise'>[])
    )
    return inst.wrapSignAndSend(api, submittable)
  }

  return {
    toRate,
    aprToFee,
    batch,
  }
}
