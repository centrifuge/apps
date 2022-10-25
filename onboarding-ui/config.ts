import * as dotenv from 'dotenv'
import * as yup from 'yup'

dotenv.config()

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

interface PoolMetadata {
  name: string
  shortName?: string
  slug: string
  description?: string
  media?: PoolMedia
  website?: string
  asset: string
  securitize?: SecuritizeData
  attributes?: { [key: string]: string | { [key: string]: string } }
  assetMaturity?: string
  currencySymbol?: string
  isUpcoming?: boolean
  isArchived?: boolean
  isLaunching?: boolean
  maker?: { ilk: string }
  issuerEmail?: string
  juniorInvestors?: JuniorInvestor[]
}

export interface BasePool {
  network: 'mainnet' | 'kovan' | 'goerli'
  version: 2 | 3
  metadata: PoolMetadata
}

export interface Pool extends BasePool {
  isUpcoming: boolean
  isLaunching: boolean
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

interface Config {
  isDemo: boolean
  onboardAPIHost: string
}

const config: Config = {
  isDemo: yup.string().required('PUBLIC_ENV is required').validateSync('demo') === 'demo',
  onboardAPIHost: yup.string().required('ONBOARD_API_HOST is required').validateSync('http://localhost:3100/'),
}

export default config
