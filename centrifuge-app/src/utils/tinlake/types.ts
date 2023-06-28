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
