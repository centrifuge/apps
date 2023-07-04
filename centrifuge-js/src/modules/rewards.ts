import BN from 'bn.js'
import { combineLatestWith, map, switchMap } from 'rxjs/operators'
import { Centrifuge } from '../Centrifuge'
import { RewardDomain } from '../CentrifugeBase'
import { Account, TransactionOptions } from '../types'
import { CurrencyBalance, TokenBalance } from '../utils/BN'

type ClaimCFGRewardsInput = [
  claimerAccountID: string, // ID of Centrifuge Chain account that should receive the rewards
  amount: string, // amount that should be received
  proof: Uint8Array[] // proof for the given claimer and amount
]

export function getRewardsModule(inst: Centrifuge) {
  // Tinlake specific
  function claimCFGRewards(args: ClaimCFGRewardsInput, options?: TransactionOptions) {
    const [claimerAccountID, amount, proof] = args

    return inst.getApi().pipe(
      switchMap((api) => {
        const submittable = api.tx.claims.claim(claimerAccountID, amount, proof)
        return inst.wrapSignAndSend(api, submittable, options)
      })
    )
  }

  // Tinlake specific
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

  function computeReward(args: [address: Account, poolId: string, trancheId: string, rewardDomain: RewardDomain]) {
    const [address, poolId, trancheId, rewardDomain] = args
    const currencyId = { Tranche: [poolId, trancheId] }

    return inst.getApi().pipe(
      switchMap((api) => api.call.rewardsApi.computeReward(rewardDomain, currencyId, address)),
      map((data) => {
        const reward = data?.toPrimitive() as string

        return reward ? new TokenBalance(reward, 18).toDecimal() : null
      })
    )
  }

  function listCurrencies(args: [address: Account, rewardDomain: RewardDomain]) {
    const [address, rewardDomain] = args

    return inst.getApi().pipe(
      switchMap((api) => api.call.rewardsApi.listCurrencies(rewardDomain, address)),

      // Todo: extends 'as' to all possible CurrencyIds
      map((data) => {
        const results = data?.toPrimitive() as {
          tranche: [number, string]
        }[]

        return results
      })
    )
  }

  function getActiveEpochData() {
    return inst.getApi().pipe(
      switchMap((api) => api.query.liquidityRewards.activeEpochData()),
      map((data) => {
        const { duration, reward, weights } = data?.toPrimitive() as {
          duration: number
          reward: string
          weights: { [key: number]: number }
        }

        return {
          duration,
          reward: new TokenBalance(reward, 18).toDecimal(),
          weights,
        }
      })
    )
  }

  function getRewardCurrencyGroup(args: [poolId: string, trancheId: string]) {
    const [poolId, trancheId] = args

    return inst.getApi().pipe(
      switchMap((api) => api.query.liquidityRewardsBase.currency({ Tranche: [poolId, trancheId] })),
      map((data) => {
        const [groupId, { totalStake }] = data?.toPrimitive() as [
          string,
          {
            rptChanges: unknown[]
            totalStake: number
          }
        ]

        return {
          groupId,
          totalStake,
        }
      })
    )
  }

  function unStake(args: [poolId: string, trancheId: string, amount: BN], options?: TransactionOptions) {
    const [poolId, trancheId, amount] = args
    const $api = inst.getApi()

    return $api.pipe(
      switchMap((api) => {
        const submittable = api.tx.liquidityRewards.unstake({ Tranche: [poolId, trancheId] }, amount)
        return inst.wrapSignAndSend(api, submittable, options)
      })
    )
  }

  function stake(args: [poolId: string, trancheId: string, amount: BN], options?: TransactionOptions) {
    const [poolId, trancheId, amount] = args
    const $api = inst.getApi()

    return $api.pipe(
      switchMap((api) => {
        const submittable = api.tx.utility.batchAll([
          api.tx.investments.collectInvestments([poolId, trancheId]),
          api.tx.liquidityRewards.stake({ Tranche: [poolId, trancheId] }, amount.toString()),
        ])
        return inst.wrapSignAndSend(api, submittable, options)
      })
    )
  }

  function claimLiquidityRewards(args: [poolId: string, trancheId: string], options?: TransactionOptions) {
    const [poolId, trancheId] = args
    const $api = inst.getApi()

    return $api.pipe(
      switchMap((api) => {
        const submittable = api.tx.liquidityRewards.claimReward({ Tranche: [poolId, trancheId] })
        return inst.wrapSignAndSend(api, submittable, options)
      })
    )
  }

  function getAccountStakes(args: [address: Account, poolId: string, trancheId: string]) {
    const [address, poolId, trancheId] = args
    const { getPoolCurrency } = inst.pools

    return inst.getApi().pipe(
      switchMap((api) => api.query.liquidityRewardsBase.stakeAccount(address, { Tranche: [poolId, trancheId] })),
      combineLatestWith(getPoolCurrency([poolId])),
      map(([data, currency]) => {
        const { stake, pendingStake, rewardTally, lastCurrencyMovement } = data.toPrimitive() as {
          stake: number
          pendingStake: number
          rewardTally: number
          lastCurrencyMovement: number
        }

        return {
          stake: new TokenBalance(stake, currency.decimals),
          pendingStake: new TokenBalance(pendingStake, currency.decimals),
          rewardTally,
          lastCurrencyMovement,
        }
      })
    )
  }

  function getORMLTokens(args: [address: Account, poolId: string, trancheId: string]) {
    const [address, poolId, trancheId] = args

    return inst.getApi().pipe(
      switchMap((api) => api.query.ormlTokens.accounts(address, { Tranche: [poolId, trancheId] })),
      map((data) => {
        const { free, reserved, frozen } = data.toPrimitive() as {
          free: number
          reserved: number
          frozen: number
        }

        return {
          free: new TokenBalance(free, 18).toDecimal(), // collected tranche tokens
          reserved: new TokenBalance(reserved, 18).toDecimal(), // staked tranche tokens
          frozen: new TokenBalance(frozen, 18).toDecimal(),
        }
      })
    )
  }

  function getEndOfEpoch() {
    return inst.getApi().pipe(
      switchMap((api) => api.query.liquidityRewards.endOfEpoch()),
      map((data) => {
        const duration = data?.toPrimitive() as number

        return duration
      })
    )
  }

  function getCurrentBlock() {
    return inst.getApi().pipe(
      switchMap((api) => api.query.system.number()),
      map((data) => {
        return data?.toPrimitive() as number
      })
    )
  }

  return {
    getORMLTokens,
    getAccountStakes,
    computeReward,
    listCurrencies,
    claimCFGRewards,
    claimedCFGRewards,
    getActiveEpochData,
    getRewardCurrencyGroup,
    unStake,
    stake,
    claimLiquidityRewards,
    getEndOfEpoch,
    getCurrentBlock,
  }
}
