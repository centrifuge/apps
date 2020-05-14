import { networkUrlToName } from './utils/networkNameResolver';
import * as yup from 'yup';

export type Pool = {
  addresses: {
    'ROOT_CONTRACT': string,
    'ACTIONS': string,
    'PROXY_REGISTRY': string,
    'COLLATERAL_NFT': string
  },
  graph: string,
  contractConfig: {
    'JUNIOR_OPERATOR': 'ALLOWANCE_OPERATOR',
    'SENIOR_OPERATOR': 'ALLOWANCE_OPERATOR' | 'PROPORTIONAL_OPERATOR'
  }
  name: string
  description: string
  asset: string
};

export interface DisplayedField {
  key:        string;
  label:      string;
  type:       string;
  decimals?:  number;
  precision?: number;
}

interface Config {
  rpcUrl: string;
  etherscanUrl: string;
  gasLimit: number;
  transactionTimeout: number;
  tinlakeDataBackendUrl: string;
  isDemo: boolean;
  network: 'Mainnet' | 'Kovan';
  pools: Pool[];
}

const contractAddressesSchema = yup.object().required().shape({
  ROOT_CONTRACT: yup.string().length(42).matches(/0x[0-9a-fA-F]{40}/).required(),
  ACTIONS: yup.string().length(42).matches(/0x[0-9a-fA-F]{40}/).required(),
  PROXY_REGISTRY: yup.string().length(42).matches(/0x[0-9a-fA-F]{40}/).required(),
  COLLATERAL_NFT: yup.string().length(42).matches(/0x[0-9a-fA-F]{40}/)
});

const contractConfigSchema = yup.object().required().shape({
  JUNIOR_OPERATOR: yup.mixed<'ALLOWANCE_OPERATOR'>().required().oneOf(['ALLOWANCE_OPERATOR']),
  SENIOR_OPERATOR: yup.mixed<'PROPORTIONAL_OPERATOR' | 'ALLOWANCE_OPERATOR'>().required().oneOf(['PROPORTIONAL_OPERATOR', 'ALLOWANCE_OPERATOR'])
});

const poolSchema = yup.object().required().shape({
  addresses: contractAddressesSchema,
  graph: yup.string().required(),
  contractConfig: contractConfigSchema,
  name: yup.string().required(),
  description: yup.string().required(),
  asset: yup.string().required()
});

const poolsSchema = yup.array().required().of(poolSchema);

const config: Config = {
  rpcUrl: yup.string().required().url().validateSync(process.env.NEXT_PUBLIC_RPC_URL),
  etherscanUrl: yup.string().required().url().validateSync(process.env.NEXT_PUBLIC_ETHERSCAN_URL),
  gasLimit: yup.number().required().validateSync(1000000000000000000), // TODO: make this into publicRuntimeConfig
  transactionTimeout: yup.number().required().moreThan(0).validateSync(process.env.NEXT_PUBLIC_TRANSACTION_TIMEOUT),
  tinlakeDataBackendUrl: yup.string().required().url().validateSync(process.env.NEXT_PUBLIC_TINLAKE_DATA_BACKEND_URL),
  isDemo: yup.string().required().validateSync(process.env.NEXT_PUBLIC_ENV) === 'demo',
  network: yup.mixed<'Mainnet' | 'Kovan'>().required().oneOf(['Mainnet', 'Kovan'])
    .validateSync(networkUrlToName(process.env.NEXT_PUBLIC_RPC_URL || '')),
  pools: poolsSchema.validateSync(process.env.NEXT_PUBLIC_POOLS)
};

export default config;
