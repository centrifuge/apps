import BN from 'bn.js'
import Decimal from 'decimal.js-light'

interface SecuritizeData {
  issuerId: string
  slug: string
}

interface PoolMedia {
  logo?: string
  icon?: string
  drop?: string
  tin?: string
}

export interface JuniorInvestor {
  name: string
  address: string
}

export interface PoolMetadataDetails {
  name: string
  shortName?: string
  slug: string
  description?: string
  media?: PoolMedia
  website?: string
  asset: string
  securitize?: SecuritizeData
  attributes?: { Issuer: string; Links: { [key: string]: string | any } }
  assetMaturity?: string
  currencySymbol?: string
  isUpcoming?: boolean
  isArchived?: boolean
  isLaunching?: boolean
  maker?: { ilk: string }
  issuerEmail?: string
  juniorInvestors?: JuniorInvestor[]
  newInvestmentsStatus: {
    junior: 'closed' | 'request' | 'open'
    senior: 'closed' | 'request' | 'open'
  }
}

interface BasePool {
  network: 'mainnet' | 'kovan' | 'goerli'
  version: 2 | 3
  metadata: PoolMetadataDetails
}

export interface UpcomingPool extends BasePool {
  presetValues: {
    seniorInterestRate?: string
    minimumJuniorRatio?: string
  }
}

export type PoolStatus = 'Upcoming' | 'Active' | 'Deployed' | 'Closed'

export interface ArchivedPoolData {
  status: PoolStatus
  legacyLink: string
  totalFinancedCurrency: string
  financingsCount: string
  seniorInterestRate: string
}

export interface ArchivedPool extends BasePool {
  archivedValues: ArchivedPoolData
}

export interface LaunchingPool extends BasePool {}

export interface ActivePool extends BasePool {
  addresses: {
    TINLAKE_CURRENCY: string
    ROOT_CONTRACT: string
    ACTIONS: string
    PROXY_REGISTRY: string
    COLLATERAL_NFT: string
    SENIOR_TOKEN: string
    JUNIOR_TOKEN: string
    CLERK?: string
    ASSESSOR: string
    RESERVE: string
    SENIOR_TRANCHE: string
    JUNIOR_TRANCHE: string
    JUNIOR_OPERATOR: string
    SENIOR_OPERATOR: string
    FEED: string
    POOL_ADMIN?: string
    SENIOR_MEMBERLIST: string
    JUNIOR_MEMBERLIST: string
    COORDINATOR: string
    PILE: string
    CLAIM_CFG: string
    MCD_VAT?: string
    MCD_JUG?: string
    MAKER_MGR?: string
  }
  versions?: {
    FEED?: number
    POOL_ADMIN?: number
  }
  contractConfig?: {
    JUNIOR_OPERATOR: 'ALLOWANCE_OPERATOR'
    SENIOR_OPERATOR: 'ALLOWANCE_OPERATOR' | 'PROPORTIONAL_OPERATOR'
  }
}

export type TinlakeMetadataPool = ActivePool | UpcomingPool | ArchivedPool | LaunchingPool

export interface IpfsPools {
  active: ActivePool[]
  archived: ArchivedPool[]
  upcoming: UpcomingPool[]
  launching: LaunchingPool[]
}

export type TokenResult = {
  symbol: string
  price: BN
  balance: BN
  payoutCurrencyAmount: BN
  payoutTokenAmount: BN
  remainingSupplyCurrency: BN
  remainingRedeemToken: BN
}

export type RewardBalance = {
  linkableRewards: string
  nonZeroBalanceSince: string
  totalRewards: string
  links: {
    centAddress: string
    rewardsAccumulated: string
  }[]
}

type AccountIDString = string

export type UserRewardsData = {
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

export type UserRewardsLink = {
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

export type RewardClaim = {
  /**
   * Hex encoded centrifuge chain account ID
   */
  accountID: string
  /**
   * Big integer CFG in base unit
   */
  balance: string
}

export type RewardsData = {
  toDateRewardAggregateValue: BN
  toDateAORewardAggregateValue: BN
  dropRewardRate: Decimal
  tinRewardRate: Decimal
  todayReward: BN
}

export type RewardDayTotals = {
  dropRewardRate: string
  tinRewardRate: string
  toDateAORewardAggregateValue: string
  toDateRewardAggregateValue: string
  todayReward: string
}
