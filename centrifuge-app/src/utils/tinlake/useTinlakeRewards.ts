import { CurrencyBalance } from '@centrifuge/centrifuge-js'
import { useCentrifugeQuery } from '@centrifuge/centrifuge-react'
import Decimal from 'decimal.js-light'
import { request } from 'graphql-request'
import { useQuery } from 'react-query'
import { combineLatest, map } from 'rxjs'
import { useAddress } from '../../utils/useAddress'
import { RewardBalance, RewardClaim, RewardDayTotals, RewardsData, UserRewardsData } from './types'

async function getTinlakeUserRewards(ethAddr: string) {
  let result
  try {
    const query = `
      {
        rewardBalances(where: {id: "${ethAddr.toLowerCase()}"}) {
          links {
            centAddress
            rewardsAccumulated
          }
          linkableRewards
          totalRewards
          nonZeroBalanceSince
        }
      }
    `
    result = await request<{ rewardBalances: RewardBalance[] }>('https://graph.centrifuge.io/tinlake', query)
  } catch (err) {
    console.error(`error occurred while fetching user rewards for user ${ethAddr} | ${err}`)
    throw err
  }

  const transformed: UserRewardsData = {
    nonZeroInvestmentSince: null,
    totalEarnedRewards: new CurrencyBalance(0, 18),
    unlinkedRewards: new CurrencyBalance(0, 18),
    links: [],
  }

  const rewardBalance = result?.rewardBalances[0]
  if (rewardBalance) {
    transformed.nonZeroInvestmentSince = rewardBalance.nonZeroBalanceSince
      ? new CurrencyBalance(rewardBalance.nonZeroBalanceSince, 18)
      : null
    transformed.totalEarnedRewards = new CurrencyBalance(new Decimal(rewardBalance.totalRewards).toFixed(0), 18)
    transformed.unlinkedRewards = new CurrencyBalance(new Decimal(rewardBalance.linkableRewards).toFixed(0), 18)
    transformed.links = (rewardBalance.links as any[]).map((link: any) => ({
      centAccountID: link.centAddress,
      earned: new CurrencyBalance(new Decimal(link.rewardsAccumulated).toFixed(0), 18),
    }))
  }

  return transformed
}

export function useTinlakeUserRewards(ethAddr?: string | null) {
  return useQuery(['getTinlakeUserRewards', ethAddr], () => getTinlakeUserRewards(ethAddr!), {
    enabled: !!ethAddr,
  })
}

async function getTinlakeRewards(): Promise<RewardsData | null> {
  let result
  try {
    const query = `
    {
      rewardDayTotals(first: 1, skip: 1, orderBy: id, orderDirection: desc) {
        dropRewardRate
        tinRewardRate
        toDateRewardAggregateValue
        toDateAORewardAggregateValue
        todayReward
      }
    }
    `
    result = await request<{ rewardDayTotals: RewardDayTotals[] }>('https://graph.centrifuge.io/tinlake', query)
  } catch (err) {
    console.error(`error occured while fetching total rewards ${err}`)
    return null
  }

  const data = result?.rewardDayTotals[0]
  if (!data) {
    return null
  }

  return {
    toDateRewardAggregateValue: new CurrencyBalance(new Decimal(data.toDateRewardAggregateValue).toFixed(0), 18),
    toDateAORewardAggregateValue: new CurrencyBalance(new Decimal(data.toDateAORewardAggregateValue).toFixed(0), 18),
    dropRewardRate: new Decimal(data.dropRewardRate),
    tinRewardRate: new Decimal(data.tinRewardRate),
    todayReward: new CurrencyBalance(new Decimal(data.todayReward).toFixed(0), 18),
  }
}

export function useTinlakeRewards() {
  return useQuery(['useTinlakeRewards'], () => getTinlakeRewards(), {
    staleTime: 60 * 60 * 1000,
  })
}

export function useUserRewards() {
  const ethAddr = useAddress('evm')
  const claimsQuery = useRewardClaims()
  const subgraphQuery = useTinlakeUserRewards(ethAddr)

  const centAddresses = subgraphQuery.data?.links.map(({ centAccountID }) => centAccountID)

  const [centChainData] = useCentrifugeQuery(
    ['cent chain data', ethAddr, centAddresses],
    (centrifuge) =>
      combineLatest(centAddresses!.map((centAccountID) => centrifuge.rewards.claimedCFGRewards([centAccountID]))).pipe(
        map((result) => {
          const links = subgraphQuery.data!.links.map((link, index) => ({
            ...link,
            claimable: new CurrencyBalance(
              claimsQuery.data!.find((rewardClaim) => rewardClaim.accountID === link.centAccountID)?.balance || 0,
              18
            ),
            claimed: result[index],
          }))
          return {
            ...subgraphQuery.data,
            links,
          }
        })
      ),
    {
      enabled:
        !!subgraphQuery?.data && !!subgraphQuery.data!.links.length && !!subgraphQuery.data && !!claimsQuery.data,
    }
  )

  // console.log('centChainQuery', centChainQuery)

  return {
    ...subgraphQuery,
    data: centChainData || subgraphQuery.data,
  }
}

export function useRewardClaims() {
  const query = useQuery('rewardsClaims', getClaimsData, {
    staleTime: Infinity,
  })
  return query
}

const rewardsTreeUrl = import.meta.env.REACT_APP_REWARDS_TREE_URL

async function getClaimsData() {
  const r = await fetch(rewardsTreeUrl)
  if (!r.ok) {
    throw new Error(`could not load rewards claims from ${rewardsTreeUrl}`)
  }
  return (await r.json()) as RewardClaim[]
}
