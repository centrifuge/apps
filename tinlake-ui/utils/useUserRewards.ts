import BN from 'bn.js'
import { useQuery } from 'react-query'
import config from '../config'
import Apollo from '../services/apollo'
import { centChainService } from '../services/centChain'
import { useAddress } from './useAddress'

// just used for readability
type AccountIDString = string

/**
 * Process to earn and claim rewards:
 * 1. User earns rewards on Ethereum for any investments on that Ethereum account `totalEarnedRewards`
 * 2. After holding a non zero investements for 30 (formerly 60) days, those rewards become claimable
 * 3. To claim rewards, user needs to link a Cent Chain account to the Ethereum account. If there is none, any rewards
 *    are in `unlinkedRewards`. If there is a link, rewards will be fully assigned to the (last) linked Cent Chain
 *    account.
 * 4. For those linked rewards to be claimable on Cent Chain, the amounts and balances (we call them together `claims`)
 *    are put once per day into a merkle tree, which's root will be stored on Cent Chain, and which's leaves will be
 *    uploaded to GCP into a storage bucket. Once the rewards are in the bucket and the root hash are stored on Cent
 *    Chain, they become claimable.
 * 5. User can now claim the rewards on Cent Chain.
 * 6. Claimed rewards can be queried from cent chain.
 */
export interface UserRewardsData {
  /**
   * From subgraph. If null, the user has not had any investments yet. If the user invested any amount, this number will
   * be a timestamp (in seconds).
   */
  nonZeroInvestmentSince: BN | null
  /**
   * From subgraph. Those are rewards that have not been linked to a Cent Chain account on Ethereum. They can be linked
   * at any time. If they are claimable, they will be immediately assigned to a linked Cent Chain account. If they are
   * not claimable, they will remain unlinked until they become claimable.
   */
  unlinkedRewards: BN
  /**
   * From subgraph. Rewards earned on Ethereum across all links for this Ethereum account so far, might be claimable,
   * might have been claimed. Should equal the sum of links.earned and unlinkedRewards
   */
  totalEarnedRewards: BN

  links: UserRewardsLink[]
}

export interface UserRewardsLink {
  /**
   * From subgraph. Cent Chain account that has been linked to this Ethereum account and can receive rewards
   */
  centAccountID: AccountIDString
  /**
   * From subgraph. Amount of rewards that have been claimed on Ethereum and have been assigned to this link/Cent
   * Chain account. Any new rewards earned by any user will be added to the latest link once per day.
   */
  earned: BN
  /**
   * From stored list of reward claims in rad-rewards-trees GCP bucket. Once per day, all Cent Chain account IDs and
   * their respective earned rewards will be put into a merkle tree, the root is stored on Centrifuge Chain and the tree
   * leaves are uploaded to GCP. NOTE: claimable can be higher than earned here,
   * since the same Centrifuge Chain account can be used by multiple Ethereum accounts.
   */
  claimable?: BN
  /**
   * From Centrifuge Chain. Amount that has already been claimed by a user on Centrifuge Chain.
   * NOTE: claimed can be higher than earned here, since the same Centrifuge Chain account can be
   * used by multiple Ethereum accounts.
   */
  claimed?: BN
}

export interface RewardClaim {
  /**
   * Hex encoded centrifuge chain account ID
   */
  accountID: string
  /**
   * Big integer CFG in base unit
   */
  balance: string
}

export function useUserRewards() {
  const ethAddr = useAddress()

  const claimsQuery = useRewardClaims()

  const subgraphQuery = useUserRewardsSubgraph(ethAddr)

  const centChainQuery = useQuery(
    ['userRewardsCentChain', ethAddr],
    () => getCentChainData(subgraphQuery.data!, claimsQuery.data!),
    {
      enabled: !!claimsQuery.data && !!subgraphQuery.data && subgraphQuery.data.links.length > 0,
    }
  )

  return {
    ...centChainQuery,
    data: centChainQuery.data || subgraphQuery.data,
    refetchCentChain: centChainQuery.refetch,
    refetch: async () => {
      await subgraphQuery.refetch()
      centChainQuery.refetch()
    },
  }
}

export function useUserRewardsSubgraph(ethAddr?: string | null) {
  return useQuery(['userRewardsSubgraph', ethAddr], () => Apollo.getUserRewards(ethAddr!), {
    enabled: !!ethAddr,
  })
}

export function useRewardClaims() {
  const query = useQuery('rewardsClaims', getClaimsData, {
    staleTime: Infinity,
  })
  return query
}

async function getCentChainData(subgraphData: UserRewardsData, claimsData: RewardClaim[]): Promise<UserRewardsData> {
  const data = await Promise.all(subgraphData.links.map((l) => centChainService().claimedCFGRewards(l.centAccountID)))

  const mergedLinks = subgraphData.links.map((l, i) => ({
    ...l,
    claimable: new BN(claimsData.find((ad) => ad.accountID === l.centAccountID)?.balance || 0),
    claimed: new BN(data[i] as any),
  }))

  return {
    ...subgraphData,
    links: mergedLinks,
  }
}

async function getClaimsData() {
  const r = await fetch(config.rewardsTreeUrl)
  console.log(config.rewardsTreeUrl)
  if (!r.ok) {
    throw new Error(`could not load rewards claims from ${config.rewardsTreeUrl}`)
  }
  return (await r.json()) as RewardClaim[]
}
