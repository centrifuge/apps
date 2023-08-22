import BN from 'bn.js'
import { combineLatestWith, filter, map, repeat, switchMap } from 'rxjs/operators'
import { Centrifuge } from '../Centrifuge'
import { RewardDomain } from '../CentrifugeBase'
import { Account, TransactionOptions } from '../types'
import { TokenBalance } from '../utils/BN'

export function getRewardsModule(inst: Centrifuge) {
  function computeReward(args: [address: Account, poolId: string, trancheId: string, rewardDomain: RewardDomain]) {
    const [address, poolId, trancheId, rewardDomain] = args
    const currencyId = { Tranche: [poolId, trancheId] }

    const $events = inst.getEvents().pipe(
      filter(({ api, events }) => {
        const event = events.find(({ event }) => api.events.liquidityRewards.NewEpoch.is(event))
        return !!event
      })
    )

    return inst.getApi().pipe(
      switchMap((api) => api.call.rewardsApi.computeReward(rewardDomain, currencyId, address)),
      map((data) => {
        const reward = data?.toPrimitive() as string

        return reward ? new TokenBalance(reward, 18).toDecimal() : null
      }),
      repeat({ delay: () => $events })
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

  function unstake(args: [poolId: string, trancheId: string, amount: BN], options?: TransactionOptions) {
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
    const [addressEvm, poolId, trancheId] = args
    const { getPoolCurrency } = inst.pools
    return inst.getApi().pipe(
      combineLatestWith(inst.getChainId()),
      switchMap(([api, chainId]) => {
        const address = inst.utils.evmToSubstrateAddress(addressEvm.toString(), chainId)
        return api.query.liquidityRewardsBase.stakeAccount(address, { Tranche: [poolId, trancheId] })
      }),
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

  function getEndOfEpoch() {
    return inst.getApi().pipe(
      switchMap((api) => api.query.liquidityRewards.endOfEpoch()),
      map((data) => {
        const duration = data?.toPrimitive() as number

        return duration
      })
    )
  }

  return {
    getAccountStakes,
    computeReward,
    listCurrencies,
    getActiveEpochData,
    getRewardCurrencyGroup,
    unstake,
    stake,
    claimLiquidityRewards,
    getEndOfEpoch,
  }
}
