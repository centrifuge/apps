import { networkUrlToName } from './utils/networkNameResolver'
import poolConfigs from 'tinlake-pool-config'
import * as yup from 'yup'

export type Pool = {
  addresses: {
    ROOT_CONTRACT: string
    ACTIONS: string
    PROXY_REGISTRY: string
    COLLATERAL_NFT: string
  }
  graph?: string
  contractConfig: {
    JUNIOR_OPERATOR: 'ALLOWANCE_OPERATOR'
    SENIOR_OPERATOR: 'ALLOWANCE_OPERATOR' | 'PROPORTIONAL_OPERATOR'
  }
  name: string
  shortName?: string
  assetOriginatorName?: string
  description?: string
  text?: string
  logo?: string
  website?: string
  email?: string
  details?: any
  investHtml?: string
  asset: string
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
  gasLimit: string
  gasPrice: string
  gas: string
  transactionTimeout: number
  tinlakeDataBackendUrl: string
  isDemo: boolean
  network: 'Mainnet' | 'Kovan'
  pools: Pool[]
  portisApiKey: string
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
  JUNIOR_OPERATOR: yup
    .mixed<'ALLOWANCE_OPERATOR'>()
    .required('contractConfigSchema.JUNIOR_OPERATOR is required')
    .oneOf(['ALLOWANCE_OPERATOR']),
  SENIOR_OPERATOR: yup
    .mixed<'PROPORTIONAL_OPERATOR' | 'ALLOWANCE_OPERATOR'>()
    .required('contractConfigSchema.SENIOR_OPERATOR is required')
    .oneOf(['PROPORTIONAL_OPERATOR', 'ALLOWANCE_OPERATOR']),
})

// TODO: text/logo/etc should be required and description/investHtml removed,
// once we migrate all pool configs to the new format
const poolSchema = yup.object().shape({
  addresses: contractAddressesSchema.required('poolSchema.addresses is required'),
  graph: yup.string(),
  contractConfig: contractConfigSchema.required('poolSchema.contractConfig is required'),
  name: yup.string().required('poolSchema.name is required'),
  shortName: yup.string(),
  assetOriginatorName: yup.string(),
  text: yup.string(),
  logo: yup.string(),
  website: yup.string(),
  email: yup.string(),
  details: yup.object(),
  description: yup.string(),
  investHtml: yup.string(),
  asset: yup.string().required('poolSchema.asset is required'),
})

const poolsSchema = yup.array().of(poolSchema)

const selectedPoolConfig = yup
  .mixed<'kovanStaging' | 'mainnetStaging' | 'mainnetProduction'>()
  .required('POOLS config is required')
  .oneOf(['kovanStaging', 'mainnetStaging', 'mainnetProduction'])
  .validateSync(process.env.NEXT_PUBLIC_POOLS_CONFIG)

const pools = poolConfigs[`${selectedPoolConfig}`]
const config: Config = {
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
  // TODO: make this into publicRuntimeConfig
  gasLimit: yup
    .number()
    .required('gasLimit is required')
    .validateSync(1000000000000000000),
  gasPrice: yup
    .string()
    .required('gasPrice is required')
    .validateSync('10000000000'),
  gas: yup
    .string()
    .required('gas is required')
    .validateSync('7000000'),
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
  pools: poolsSchema.validateSync(pools),
  portisApiKey: yup
    .string()
    .required()
    .validateSync(process.env.NEXT_PUBLIC_PORTIS_KEY),
}

export default config
