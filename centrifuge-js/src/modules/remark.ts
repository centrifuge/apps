import { of, switchMap } from 'rxjs'
import { CentrifugeBase } from '../CentrifugeBase'
import { TransactionOptions } from '../types'
import { CurrencyBalance } from '../utils/BN'

export function getRemarkModule(inst: CentrifugeBase) {
  function remarkWithEvent(args: [message: string], options?: TransactionOptions) {
    const [message] = args
    const $api = inst.getApi()
    return $api.pipe(switchMap((api) => inst.wrapSignAndSend(api, api.tx.system.remarkWithEvent(message), options)))
  }

  // TODO: validate that the address that signed the remark is the same as the wallet making the request
  function validateRemark(blockNumber: string, txHash: string, expectedRemark: string, isEvmOnSubstrate?: boolean) {
    return inst.getBlockByBlockNumber(Number(blockNumber)).pipe(
      switchMap((block) => {
        if (isEvmOnSubstrate) {
          const extrinsic = block.block.extrinsics.find((ex) => {
            return ex.method.method.toString() === 'transact' && ex.method.section === 'ethereum'
          })
          // @ts-expect-error
          const evmInput = extrinsic?.method.args?.[0].toJSON()?.eip1559?.input.slice(10)
          const actualRemark = Buffer.from(`${evmInput}`, 'hex').toString()

          if (actualRemark !== expectedRemark) {
            throw new Error('Invalid remark')
          }
          return of(true)
        }
        const extrinsic = block?.block.extrinsics.find((ex) => ex.hash.toString() === txHash)
        const actualRemark = extrinsic?.method.args[0].toHuman()
        if (actualRemark !== expectedRemark) {
          throw new Error('Invalid remark')
        }
        return of(true)
      })
    )
  }

  function remarkFeeTransaction(
    args: [poolId: string, loanId: string, chargeFee: CurrencyBalance],
    options?: TransactionOptions
  ) {
    const $api = inst.getApi()
    const [poolId, loanId, chargeFee] = args
    return $api.pipe(
      switchMap((api) => {
        const chargeFeeTx = api.tx.system.remark(
          `Fee charged for loan ${loanId} in pool ${poolId}. Amount: ${chargeFee.toString()}`
        )
        return inst.wrapSignAndSend(api, api.tx.remarks.remark([{ Loan: [poolId, loanId] }], chargeFeeTx), options)
      })
    )
  }

  return {
    remarkWithEvent,
    validateRemark,
    remarkFeeTransaction,
  }
}
