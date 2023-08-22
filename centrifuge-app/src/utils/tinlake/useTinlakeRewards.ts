import { CurrencyBalance } from '@centrifuge/centrifuge-js'
import { useCentrifugeQuery } from '@centrifuge/centrifuge-react'
import Decimal from 'decimal.js-light'
import { useQuery } from 'react-query'
import { combineLatest, map } from 'rxjs'
import { useAddress } from '../../utils/useAddress'
import { RewardBalance, RewardClaim, RewardDayTotals, RewardsData, UserRewardsData } from './types'

async function getTinlakeUserRewards(ethAddr: string) {
  let rewardBalances: RewardBalance[] = []

  const response = await fetch('https://graph.centrifuge.io/tinlake', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: `
        query GetRewardBalances($address: String!) {
          rewardBalances(where: {id: $address}) {
            links {
              centAddress
              rewardsAccumulated
            }
            linkableRewards
            totalRewards
            nonZeroBalanceSince
          }
        }
        `,
      variables: {
        address: ethAddr.toLowerCase(),
      },
    }),
  })

  if (response?.ok) {
    const { data } = await response.json()
    ;({ rewardBalances } = data)
  } else {
    throw new Error(`Error occurred while fetching user rewards for user ${ethAddr}`)
  }

  const transformed: UserRewardsData = {
    nonZeroInvestmentSince: null,
    totalEarnedRewards: new CurrencyBalance(0, 18),
    unlinkedRewards: new CurrencyBalance(0, 18),
    links: [],
  }

  const rewardBalance = rewardBalances[0]
  if (rewardBalance) {
    transformed.nonZeroInvestmentSince = rewardBalance.nonZeroBalanceSince
      ? new CurrencyBalance(rewardBalance.nonZeroBalanceSince, 18)
      : null
    transformed.totalEarnedRewards = new CurrencyBalance(new Decimal(rewardBalance.totalRewards).toFixed(0), 18)
    transformed.unlinkedRewards = new CurrencyBalance(new Decimal(rewardBalance.linkableRewards).toFixed(0), 18)
    transformed.links = rewardBalance.links.map((link) => ({
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
  let rewardDayTotals: RewardDayTotals[] = []

  const response = await fetch('https://graph.centrifuge.io/tinlake', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: `
        query GetRewardDayTotals {
          rewardDayTotals(first: 1, skip: 1, orderBy: id, orderDirection: desc) {
            dropRewardRate
            tinRewardRate
            toDateRewardAggregateValue
            toDateAORewardAggregateValue
            todayReward
          }
        }
        `,
    }),
  })

  if (response?.ok) {
    const { data } = await response.json()
    rewardDayTotals = data.rewardDayTotals
  } else {
    throw new Error('Error occured while fetching total rewards')
  }

  const data = rewardDayTotals[0]

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
      combineLatest(centAddresses!.map((centAccountID) => centrifuge.tinlake.claimedCFGRewards([centAccountID]))).pipe(
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
