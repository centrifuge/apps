import contractAbiPoolRegistry from '@centrifuge/tinlake-js/src/abi/PoolRegistry.abi.json'
import BN from 'bn.js'
import { ethers } from 'ethers'
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
  drop?: string
  tin?: string
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
    SENIOR_TOKEN: string
    JUNIOR_TOKEN: string
    ASSESSOR: string
  }
  contractConfig?: {
    JUNIOR_OPERATOR: 'ALLOWANCE_OPERATOR'
    SENIOR_OPERATOR: 'ALLOWANCE_OPERATOR' | 'PROPORTIONAL_OPERATOR'
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
  poolRegistry: string
  rpcUrl: string
  ipfsGateway: string
  etherscanUrl: string
  transactionTimeout: number
  tinlakeDataBackendUrl: string
  isDemo: boolean
  network: 'Mainnet' | 'Kovan'
  portisApiKey: string
  infuraKey: string
  gasLimit: number
  onboardAPIHost: string
  featureFlagNewOnboardingPools: string[]
  enableErrorLogging: boolean
  centrifugeChainUrl: string
  claimCFGContractAddress: string
  rewardsTreeUrl: string
  multicallContractAddress: string
  matomoSiteId: number | undefined
}

export interface IpfsPools {
  active: Pool[]
  archived: ArchivedPool[]
  upcoming: UpcomingPool[]
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
  attributes: yup.object(),
  asset: yup.string().required('poolSchema.asset is required'),
  assetMaturity: yup.string(),
  securitize: securitizeDataSchema,
  currencySymbol: yup.string().default('DAI'),
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

export let ipfsPools: IpfsPools | undefined = undefined

// TODO: temp for now until we figure out a better way to handle not having an instance of Tinlake
const assembleIpfsUrl = async (): Promise<string> => {
  const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl)
  let url: URL
  if (process.env.NEXT_PUBLIC_POOLS_IPFS_HASH_OVERRIDE) {
    url = new URL(process.env.NEXT_PUBLIC_POOLS_IPFS_HASH_OVERRIDE, config.ipfsGateway)
    return url.href
  }
  const registry = new ethers.Contract(config.poolRegistry, contractAbiPoolRegistry, provider)
  const poolData = await registry.pools(0)
  url = new URL(poolData[3], config.ipfsGateway)
  return url.href
}

export const loadPoolsFromIPFS = async () => {
  if (ipfsPools) {
    return ipfsPools
  }
  const url = await assembleIpfsUrl()
  const response = await fetch(url)
  const body = await response.json()
  const networkConfigs: any[] = Object.values(body)

  const active = poolsSchema
    .validateSync(networkConfigs.filter((p: Pool) => p.addresses && p.addresses.ROOT_CONTRACT))
    .map((p) => ({ ...p, isUpcoming: false } as Pool))
  const archived = archivedPoolsSchema
    .validateSync(networkConfigs.filter((p: Pool) => 'archivedValues' in p))
    .map((p) => ({ ...p, isArchived: true } as ArchivedPool))
  const upcoming = upcomingPoolsSchema
    .validateSync(networkConfigs.filter((p: Pool) => !('archivedValues' in p) && !p.addresses))
    .map((p) => ({ ...p, isUpcoming: true } as UpcomingPool))
  ipfsPools = { active, upcoming, archived }
  return ipfsPools
}

const config: Config = {
  poolRegistry: yup
    .string()
    .required('NEXT_PUBLIC_POOL_REGISTRY is required')
    .validateSync(process.env.NEXT_PUBLIC_POOL_REGISTRY),
  rpcUrl: yup
    .string()
    .required('NEXT_PUBLIC_RPC_URL is required')
    .url()
    .validateSync(process.env.NEXT_PUBLIC_RPC_URL),
  ipfsGateway: yup
    .string()
    .required('NEXT_PUBLIC_IPFS_GATEWAY is required')
    .url()
    .validateSync(process.env.NEXT_PUBLIC_IPFS_GATEWAY),
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
    .required('NEXT_PUBLIC_PORTIS_KEY is required')
    .validateSync(process.env.NEXT_PUBLIC_PORTIS_KEY),
  infuraKey: yup
    .string()
    .required('NEXT_PUBLIC_INFURA_KEY is required')
    .validateSync(process.env.NEXT_PUBLIC_INFURA_KEY),
  gasLimit: yup
    .number()
    .required('gasLimit is required')
    .validateSync('7000000'),
  onboardAPIHost: yup
    .string()
    .required('NEXT_PUBLIC_ONBOARD_API_HOST is required')
    .validateSync(process.env.NEXT_PUBLIC_ONBOARD_API_HOST),
  centrifugeChainUrl: yup
    .string()
    .required('NEXT_PUBLIC_CENTRIFUGE_CHAIN_URL is required')
    .validateSync(process.env.NEXT_PUBLIC_CENTRIFUGE_CHAIN_URL),
  claimCFGContractAddress: yup
    .string()
    .length(42)
    .matches(/0x[0-9a-fA-F]{40}/)
    .required('NEXT_PUBLIC_CLAIM_CFG_CONTRACT_ADDRESS is required')
    .validateSync(process.env.NEXT_PUBLIC_CLAIM_CFG_CONTRACT_ADDRESS),
  rewardsTreeUrl: yup
    .string()
    .required('NEXT_PUBLIC_REWARDS_TREE_URL is required')
    .validateSync(process.env.NEXT_PUBLIC_REWARDS_TREE_URL),
  enableErrorLogging: yup.boolean().validateSync(false),
  // Loading a comma-separated string as a string array using yup proved hard/impossible
  featureFlagNewOnboardingPools: process.env.NEXT_PUBLIC_FEATURE_FLAG_NEW_ONBOARDING?.split(',') || [],
  multicallContractAddress: yup
    .string()
    .required('NEXT_PUBLIC_MULTICALL_CONTRACT_ADDRESS is required')
    .validateSync(process.env.NEXT_PUBLIC_MULTICALL_CONTRACT_ADDRESS),
  matomoSiteId: yup
    .number()
    .optional()
    .validateSync(process.env.NEXT_PUBLIC_MATOMO_SITE_ID),
}

function between1e23and1e27(s: string): boolean {
  const n = new BN(s)
  return n.gte(new BN('100000000000000000000000')) && n.lte(new BN('1000000000000000000000000000'))
}

function fee(s: string): boolean {
  const n = new BN(s)
  return n.gte(new BN('1000000000000000000000000000')) && n.lte(new BN('1000000009000000000000000000'))
}

export default config
