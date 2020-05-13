import { networkUrlToName } from './utils/networkNameResolver';
import * as yup from 'yup';

interface ContractAddresses {
  DEPLOYMENT_NAME: string;
  ROOT_CONTRACT: string;
  TINLAKE_CURRENCY: string;
  ACTIONS: string;
  PROXY_REGISTRY: string;
  COLLATERAL_NFT: string;
}

export interface NFTDataDefinition {
  contractCall:    ContractCall;
  displayedFields: DisplayedField[];
}

export interface ContractCall {
  outputs: Output[];
}

export interface Output {
  name: string;
  type: 'address' | 'uint256' | 'string';
}

export interface DisplayedField {
  key:        string;
  label:      string;
  type:       string;
  decimals?:  number;
  precision?: number;
}

interface ContractConfig {
  JUNIOR_OPERATOR: 'ALLOWANCE_OPERATOR';
  SENIOR_OPERATOR: 'PROPORTIONAL_OPERATOR';
}

const contractAddressesSchema = yup.object().required().shape({
  DEPLOYMENT_NAME: yup.string().required(),
  ROOT_CONTRACT: yup.string().length(42).matches(/0x[0-9a-fA-F]{40}/).required(),
  TINLAKE_CURRENCY: yup.string().length(42).matches(/0x[0-9a-fA-F]{40}/).required(),
  ACTIONS: yup.string().length(42).matches(/0x[0-9a-fA-F]{40}/).required(),
  PROXY_REGISTRY: yup.string().length(42).matches(/0x[0-9a-fA-F]{40}/).required(),
  COLLATERAL_NFT: yup.string().length(42).matches(/0x[0-9a-fA-F]{40}/).required()
});

const nftDataDefinitionSchema = yup.object().required().shape({
  contractCall: yup.object().required().shape({
    outputs: yup.array(yup.object().shape({
      name: yup.string().required().min(1),
      type: yup.mixed<'address' | 'uint256' | 'string'>().required().oneOf(['address', 'uint256', 'string'])
    }))
  }),
  displayedFields: yup.array(yup.object().shape({
    key: yup.string().required().min(1),
    label: yup.string().required().min(1),
    type: yup.string().required().min(1),
    decimals: yup.number().min(0),
    precision: yup.number().min(0)
  }))
});

const contractConfigSchema = yup.object().required().shape({
  JUNIOR_OPERATOR: yup.mixed<'ALLOWANCE_OPERATOR'>().required().oneOf(['ALLOWANCE_OPERATOR']),
  SENIOR_OPERATOR: yup.mixed<'PROPORTIONAL_OPERATOR'>().required().oneOf(['PROPORTIONAL_OPERATOR'])
});

interface Config {
  rpcUrl: string;
  etherscanUrl: string;
  gasLimit: number;
  contractAddresses: ContractAddresses;
  nftDataDefinition: NFTDataDefinition;
  transactionTimeout: number;
  tinlakeDataBackendUrl: string;
  isDemo: boolean;
  network: 'Mainnet' | 'Kovan';
  contractConfig:  ContractConfig;
}

const config: Config = {
  rpcUrl: yup.string().required().url().validateSync(process.env.NEXT_PUBLIC_RPC_URL),
  etherscanUrl: yup.string().required().url().validateSync(process.env.NEXT_PUBLIC_ETHERSCAN_URL),
  gasLimit: yup.number().required().validateSync(1000000000000000000), // TODO: make this into publicRuntimeConfig
  contractAddresses: contractAddressesSchema.validateSync(process.env.NEXT_PUBLIC_TINLAKE_ADDRESSES),
  nftDataDefinition: nftDataDefinitionSchema.validateSync(process.env.NEXT_PUBLIC_NFT_DATA_DEFINITION),
  transactionTimeout: yup.number().required().moreThan(0).validateSync(process.env.NEXT_PUBLIC_TRANSACTION_TIMEOUT),
  tinlakeDataBackendUrl: yup.string().required().url().validateSync(process.env.NEXT_PUBLIC_TINLAKE_DATA_BACKEND_URL),
  isDemo: yup.string().required().validateSync(process.env.NEXT_PUBLIC_ENV) === 'demo',
  network: yup.mixed<'Mainnet' | 'Kovan'>().required().oneOf(['Mainnet', 'Kovan'])
    .validateSync(networkUrlToName(process.env.NEXT_PUBLIC_RPC_URL || '')),
  contractConfig:  contractConfigSchema.validateSync(process.env.NEXT_PUBLIC_CONTRACT_CONFIG)
};

export default config;
