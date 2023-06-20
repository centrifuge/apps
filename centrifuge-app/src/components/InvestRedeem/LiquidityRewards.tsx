import { TokenBalance } from '@centrifuge/centrifuge-js'
import { useCentrifugeQuery, useCentrifugeTransaction } from '@centrifuge/centrifuge-react'
import { Box, Button, Text } from '@centrifuge/fabric'
import { Dec } from '../../utils/Decimal'
import { formatBalance } from '../../utils/formatting'
import { useAddress } from '../../utils/useAddress'
import { usePendingCollect } from '../../utils/usePools'
import { useInvestRedeem } from './InvestRedeemProvider'

function useAccountStakes(address?: string, poolId?: string, trancheId?: string) {
  const [result] = useCentrifugeQuery(
    ['stakes', address, poolId, trancheId],
    (cent) => cent.pools.getAccountStakes([address!, poolId!, trancheId!]),
    {
      suspense: true,
      enabled: !!address && !!poolId && !!trancheId,
    }
  )

  return result
}

function useOrmlTokens(address?: string, poolId?: string, trancheId?: string) {
  const [result] = useCentrifugeQuery(
    ['orml tokens', address, poolId, trancheId],
    (cent) => cent.pools.getORMLTokens([address!, poolId!, trancheId!]),
    {
      suspense: true,
      enabled: !!address && !!poolId && !!trancheId,
    }
  )

  return result
}

function useActiveEpochData() {
  const [result] = useCentrifugeQuery(
    ['Liquidity Rewards Active Epoch Data'],
    (cent) => cent.pools.getLiquidityRewardsActiveEpochData(),
    {
      suspense: true,
    }
  )

  return result
}

function useRewardCurrencyGroup(poolId?: string, trancheId?: string) {
  const [result] = useCentrifugeQuery(
    ['reward currency group', poolId, trancheId],
    (cent) => cent.pools.getRewardCurrencyGroup([poolId!, trancheId!]),
    {
      suspense: true,
      enabled: !!poolId && !!trancheId,
    }
  )

  return result
}

function useComputeLiquidityRewards(address?: string, poolId?: string, trancheId?: string) {
  const [result] = useCentrifugeQuery(
    ['compute liquidity rewards', address, poolId, trancheId, '7789'],
    (cent) => cent.pools.computeLiquidityRewards([address!, poolId!, trancheId!]),
    {
      suspense: true,
      enabled: !!address && !!poolId && !!trancheId,
    }
  )

  return result
}

function useListCurrencies(address?: string) {
  const [result] = useCentrifugeQuery(['list currencies', address], (cent) => cent.pools.listCurrencies([address!]), {
    suspense: true,
    enabled: !!address,
  })

  return result
}

export function LiquidityRewards() {
  const { state } = useInvestRedeem()
  const add = useAddress()
  console.log('state', state)
  console.log('add', add)

  const rewards = useComputeLiquidityRewards(add, state.poolId, state.trancheId)
  // const listCurrencies = useListCurrencies(add)
  console.log('rewards', rewards)
  // console.log('listCurrencies', listCurrencies)

  const pendingRedeem = state.order?.remainingRedeemToken ?? Dec(0)
  // pendingRedeem.mul(state.tokenPrice)
  const investedAmount = state.order?.remainingInvestCurrency ?? Dec(0) // was pendingInvest

  const stakes = useAccountStakes(add, state.poolId, state.trancheId)
  // console.log('stake', stakes?.stake.toString())
  const ormlTokens = useOrmlTokens(add, state.poolId, state.trancheId)
  // console.log('ormlTokens free', ormlTokens?.free.toString())
  // console.log('ormlTokens reserved', ormlTokens?.reserved.toString())

  // console.log('pendingRedeem', pendingRedeem.toString())
  // console.log('investedAmount', investedAmount.toString())
  // console.log('payoutTokenAmount', state.order?.payoutTokenAmount.toString())
  // console.log('investmentValue', state.investmentValue.toString())
  // console.log('trancheBalance', state.trancheBalance.toString())
  // console.log('-----------')

  const canClaim = false

  // options:
  // - !state?.order?.payoutTokenAmount.isZero()
  // - !state.investmentValue.isZero() && stakes?.stake.lessThan(state.investmentValue)
  // - !state.trancheBalance.isZero()
  const canStake = !state.trancheBalance.isZero() // was 1

  const canUnstake = !stakes?.stake.isZero()

  const test = usePendingCollect(state.poolId, state.trancheId, add)
  const test2 = useActiveEpochData()

  const { execute: claimLiquidityRewards, isLoading: claimLiquidityRewardsLoading } = useCentrifugeTransaction(
    'Claim CFG liquidity rewards',
    (cent) => cent.pools.claimLiquidityRewards,
    {
      onSuccess: (args) => {
        console.log('onSuccess received arguments', args)
      },
    }
  )

  const { execute: executeStake, isLoading: stakeLoading } = useCentrifugeTransaction(
    'Stake tokens',
    (cent) => cent.pools.collectAndStake,
    {
      onSuccess: (args) => {
        console.log('onSuccess received arguments', args)
      },
    }
  )

  const { execute: executeUnstake, isLoading: unstakeLoading } = useCentrifugeTransaction(
    'Unstake tokens',
    (cent) => cent.pools.unStake,
    {
      onSuccess: (args) => {
        console.log('onSuccess received arguments', args)
      },
    }
  )

  function claim() {
    if (!state.trancheId) {
      return
    }

    claimLiquidityRewards([state.trancheId])
  }

  function stake() {
    if (!state.poolCurrency || !state.order || !state.trancheId || !state.trancheCurrency) {
      return
    }

    // options:
    // 1) TokenBalance.fromFloat(state.order.payoutTokenAmount, state.poolCurrency.decimals)
    // 2)
    // const stakedAmount = stakes?.stake || Dec(0)
    // TokenBalance.fromFloat(state.investmentValue.minus(stakedAmount), state.poolCurrency.decimals)
    // 3) TokenBalance.fromFloat(state.trancheBalance, state.trancheCurrency?.decimals)

    const amount = TokenBalance.fromFloat(state.trancheBalance, state.trancheCurrency?.decimals) // was 1
    executeStake([state.poolId, state.trancheId, amount])
  }

  function unStake() {
    if (!state.poolCurrency || !state.poolId || !state.trancheId || !stakes?.stake) {
      return
    }

    const amount = TokenBalance.fromFloat(stakes.stake, state.poolCurrency.decimals)
    executeUnstake([state.poolId, state.trancheId, amount])
  }

  return (
    <Box>
      {!stakes?.stake.isZero() && <Text>Staked amount: {formatBalance(stakes!.stake)}</Text>}
      {canUnstake && (
        <Button onClick={unStake} loading={unstakeLoading}>
          unstake
        </Button>
      )}

      {canStake && (
        <Button onClick={stake} loading={stakeLoading}>
          stake
        </Button>
      )}
    </Box>
  )
}
