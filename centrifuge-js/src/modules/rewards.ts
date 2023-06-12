import { map, switchMap } from 'rxjs/operators'
import { Centrifuge } from '../Centrifuge'
import { TransactionOptions } from '../types'
import { CurrencyBalance } from '../utils/BN'

type ClaimCFGRewardsInput = [
  claimerAccountID: string, // ID of Centrifuge Chain account that should receive the rewards
  amount: string, // amount that should be received
  proof: Uint8Array[] // proof for the given claimer and amount
]

export function getRewardsModule(inst: Centrifuge) {
  function claimCFGRewards(args: ClaimCFGRewardsInput, options?: TransactionOptions) {
    const [claimerAccountID, amount, proof] = args

    return inst.getApi().pipe(
      switchMap((api) => {
        const submittable = api.tx.claims.claim(claimerAccountID, amount, proof)
        return inst.wrapSignAndSend(api, submittable, options)
      })
    )
  }

  function claimedCFGRewards(args: [centAddr: string]) {
    const [centAddr] = args

    return inst.getApi().pipe(
      switchMap((api) =>
        api.query.claims.claimedAmounts(centAddr).pipe(
          map((claimed) => {
            return new CurrencyBalance(claimed.toString(), api.registry.chainDecimals[0])
          })
        )
      )
    )
  }

  return {
    claimCFGRewards,
    claimedCFGRewards,
  }
}
