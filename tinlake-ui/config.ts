import kovanPools from '@centrifuge/tinlake-pools-kovan'
import mainnetPools from '@centrifuge/tinlake-pools-mainnet'
import BN from 'bn.js'
import * as yup from 'yup'
import { PoolStatus } from './ducks/pool'
import { networkUrlToName } from './utils/networkNameResolver'

interface SecuritizeData {
  issuerId: string
  slug: string
}

interface PoolMedia {
  logo?: string
  icon?: string
}

interface PoolMetadata {
  name: string
  shortName?: string
  slug: string
  description?: string
  media?: PoolMedia
  website?: string
  details?: any
  asset: string
  discourseLink?: string
  securitize?: SecuritizeData
}

export interface BasePool {
  network: 'mainnet' | 'kovan'
  version: 2 | 3
  metadata: PoolMetadata
}

export interface UpcomingPool extends BasePool {
  isUpcoming: true
  presetValues: {
    seniorInterestRate?: string
    minimumJuniorRatio?: string
  }
}

export interface ArchivedPool extends BasePool {
  isArchived: true
  archivedValues: {
    status: PoolStatus
    legacyLink: string
    totalFinancedCurrency: string
    financingsCount: string
    seniorInterestRate: string
  }
}

export interface Pool extends BasePool {
  isUpcoming: false
  addresses: {
    ROOT_CONTRACT: string
    ACTIONS: string
    PROXY_REGISTRY: string
    COLLATERAL_NFT: string
  }
  contractConfig?: {
    JUNIOR_OPERATOR: 'ALLOWANCE_OPERATOR'
    SENIOR_OPERATOR: 'ALLOWANCE_OPERATOR' | 'PROPORTIONAL_OPERATOR'
    partialRepay?: boolean
  }
}

export interface DisplayedField {
  key: string
  label: string
  type: string
  decimals?: number
  precision?: number
}

interface Config {
  rpcUrl: string
  etherscanUrl: string
  transactionTimeout: number
  tinlakeDataBackendUrl: string
  isDemo: boolean
  network: 'Mainnet' | 'Kovan'
  pools: Pool[]
  upcomingPools: UpcomingPool[]
  archivedPools: ArchivedPool[]
  portisApiKey: string
  gasLimit: number
  onboardAPIHost: string
  featureFlagNewOnboarding: boolean
  enableErrorLogging: boolean
}

const contractAddressesSchema = yup.object().shape({
  ROOT_CONTRACT: yup
    .string()
    .length(42)
    .matches(/0x[0-9a-fA-F]{40}/)
    .required('contractAddressesSchema.ROOT_CONTRACT is required'),
  ACTIONS: yup
    .string()
    .length(42)
    .matches(/0x[0-9a-fA-F]{40}/)
    .required('contractAddressesSchema.ACTIONS is required'),
  PROXY_REGISTRY: yup
    .string()
    .length(42)
    .matches(/0x[0-9a-fA-F]{40}/)
    .required('contractAddressesSchema.PROXY_REGISTRY is required'),
  COLLATERAL_NFT: yup
    .string()
    .length(42)
    .matches(/0x[0-9a-fA-F]{40}/),
})

const contractConfigSchema = yup.object().shape({
  JUNIOR_OPERATOR: yup.mixed<'ALLOWANCE_OPERATOR'>().oneOf(['ALLOWANCE_OPERATOR']),
  SENIOR_OPERATOR: yup
    .mixed<'PROPORTIONAL_OPERATOR' | 'ALLOWANCE_OPERATOR'>()
    .oneOf(['PROPORTIONAL_OPERATOR', 'ALLOWANCE_OPERATOR']),
  partialRepay: yup.bool(),
})

const securitizeDataSchema = yup.object().shape({
  issuerId: yup.string().default(''),
  slug: yup.string().default(''),
})

const mediaSchema = yup.object().shape({
  logo: yup.string(),
  icon: yup.string(),
})

const metadataSchema = yup.object().shape({
  name: yup.string().required('poolSchema.name is required'),
  shortName: yup.string(),
  slug: yup.string().required('poolSchema.slug is required'),
  description: yup.string(),
  media: mediaSchema,
  website: yup.string(),
  details: yup.object(),
  asset: yup.string().required('poolSchema.asset is required'),
  discourseLink: yup.string(),
  securitize: securitizeDataSchema,
})

const poolSchema = yup.object().shape({
  network: yup
    .string()
    .oneOf(['mainnet', 'kovan'])
    .required('poolSchema.network is required'),
  version: yup
    .number()
    .oneOf([2, 3])
    .required('poolSchema.version is required'),
  addresses: contractAddressesSchema.required('poolSchema.addresses is required'),
  contractConfig: contractConfigSchema.default(undefined),
  metadata: metadataSchema.required('poolSchema.metadata is required'),
})

const upcomingPoolSchema = yup.object().shape({
  network: yup
    .string()
    .oneOf(['mainnet', 'kovan'])
    .required('poolSchema.network is required'),
  version: yup
    .number()
    .oneOf([2, 3])
    .required('poolSchema.version is required'),
  metadata: metadataSchema.required('poolSchema.metadata is required'),
  presetValues: yup.object().shape({
    seniorInterestRate: yup
      .string()
      .default('1000000003170979198376458650')
      .test('fee', 'value must be a fee such as 1000000003170979198376458650', fee),
    minimumJuniorRatio: yup
      .string()
      .default('200000000000000000000000000')
      .test('between-1e23-1e27', 'value must between 0 and 1e25', between1e23and1e27),
  }),
})

const archivedPoolSchema = yup.object().shape({
  network: yup
    .string()
    .oneOf(['mainnet', 'kovan'])
    .required('poolSchema.network is required'),
  version: yup
    .number()
    .oneOf([2, 3])
    .required('poolSchema.version is required'),
  metadata: metadataSchema.required('poolSchema.metadata is required'),
  archivedValues: yup.object().shape({
    status: yup.string().oneOf(['Deployed', 'Closed']),
    legacyLink: yup.string(),
    totalFinancedCurrency: yup.string(),
    financingsCount: yup.string(),
    seniorInterestRate: yup
      .string()
      .default('1000000003170979198376458650')
      .test('fee', 'value must be a fee such as 1000000003170979198376458650', fee),
  }),
})

const poolsSchema = yup.array(poolSchema)
const upcomingPoolsSchema = yup.array(upcomingPoolSchema)
const archivedPoolsSchema = yup.array(archivedPoolSchema)

const selectedPoolConfig = yup
  .mixed<'kovanStaging' | 'mainnetStaging' | 'mainnetProduction'>()
  .required('POOLS config is required')
  .oneOf(['kovanStaging', 'mainnetStaging', 'mainnetProduction'])
  .validateSync(process.env.NEXT_PUBLIC_POOLS_CONFIG)

const networkConfigs = selectedPoolConfig === 'mainnetProduction' ? mainnetPools : kovanPools

const pools = poolsSchema
  .validateSync(networkConfigs.filter((p: Pool) => p.addresses && p.addresses.ROOT_CONTRACT))
  .map((p) => ({ ...p, isUpcoming: false } as Pool))
const archivedPools = archivedPoolsSchema
  .validateSync(networkConfigs.filter((p: Pool) => 'archivedValues' in p))
  .map((p) => ({ ...p, isArchived: true } as ArchivedPool))
const upcomingPools = upcomingPoolsSchema
  .validateSync(networkConfigs.filter((p: Pool) => !('archivedValues' in p) && !p.addresses))
  .map((p) => ({ ...p, isUpcoming: true } as UpcomingPool))

const config: Config = {
  pools,
  upcomingPools,
  archivedPools,
  rpcUrl: yup
    .string()
    .required('NEXT_PUBLIC_RPC_URL is required')
    .url()
    .validateSync(process.env.NEXT_PUBLIC_RPC_URL),
  etherscanUrl: yup
    .string()
    .required('NEXT_PUBLIC_ETHERSCAN_URL is required')
    .url()
    .validateSync(process.env.NEXT_PUBLIC_ETHERSCAN_URL),
  transactionTimeout: yup
    .number()
    .required('NEXT_PUBLIC_TRANSACTION_TIMEOUT is required')
    .moreThan(0)
    .validateSync(process.env.NEXT_PUBLIC_TRANSACTION_TIMEOUT),
  tinlakeDataBackendUrl: yup
    .string()
    .required('NEXT_PUBLIC_TINLAKE_DATA_BACKEND_URL is required')
    .url()
    .validateSync(process.env.NEXT_PUBLIC_TINLAKE_DATA_BACKEND_URL),
  isDemo:
    yup
      .string()
      .required('NEXT_PUBLIC_ENV is required')
      .validateSync(process.env.NEXT_PUBLIC_ENV) === 'demo',
  network: yup
    .mixed<'Mainnet' | 'Kovan'>()
    .required('NEXT_PUBLIC_RPC_URL is required')
    .oneOf(['Mainnet', 'Kovan'])
    .validateSync(networkUrlToName(process.env.NEXT_PUBLIC_RPC_URL || '')),
  portisApiKey: yup
    .string()
    .required()
    .validateSync(process.env.NEXT_PUBLIC_PORTIS_KEY),
  gasLimit: yup
    .number()
    .required('gasLimit is required')
    .validateSync('7000000'),
  onboardAPIHost: yup
    .string()
    .required('NEXT_PUBLIC_ONBOARD_API_HOST is required')
    .validateSync(process.env.NEXT_PUBLIC_ONBOARD_API_HOST),
  featureFlagNewOnboarding: yup.boolean().validateSync(process.env.NEXT_PUBLIC_FEATURE_FLAG_NEW_ONBOARDING),
  enableErrorLogging: yup.boolean().validateSync(false),
}

export default config

function between1e23and1e27(s: string): boolean {
  const n = new BN(s)
  if (n.gte(new BN('100000000000000000000000')) && n.lte(new BN('1000000000000000000000000000'))) {
    return true
  }
  return false
}

function fee(s: string): boolean {
  const n = new BN(s)
  if (n.gte(new BN('1000000000000000000000000000')) && n.lte(new BN('1000000009000000000000000000'))) {
    return true
  }
  return false
}
