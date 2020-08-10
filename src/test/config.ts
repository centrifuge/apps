import contractAddresses from './addresses.json';
import abiDefinitions from '../abi/';
import { Account } from './types';
import { ContractAddresses, ContractAbis } from '../Tinlake';
import dotenv from 'dotenv';

dotenv.config();

const KWEI = 1000;
const MWEI = 1000 * KWEI;
const GWEI = 1000 * MWEI;
const MILLI_ETH = 1e15; // 0.001 ETH
const FAUCET_AMOUNT = 5000 * MILLI_ETH;

const GAS_PRICE = 100 * GWEI;
const GAS = 1000000;

const testConfig : ProviderConfig = {
  contractAddresses: process.env.CONTRACTS && JSON.parse(process.env.CONTRACTS) || contractAddresses,
  godAccount: {
    address: process.env.GOD_ADDRESS || '0xf6fa8a3f3199cdd85749ec749fb8f9c2551f9928',
    publicKey: process.env.GOD_PUB_KEY || '',
    privateKey: process.env.GOD_PRIV_KEY || '0xb2e0c8e791c37df214808cdadc187f0cba0e36160f1a38b321a25c9a0cea8c11',
  },
  nftRegistry: process.env.NFT_REGISTRY || '0xac0c1ef395290288028a0a9fdfc8fdebebe54a24',
  transactionTimeout: 50000,
  gasPrice: `${GAS_PRICE}`,
  gas: `${GAS}`,
  rpcUrl: process.env.RPC_URL || 'http://127.0.0.1:8545',
  contractAbis: abiDefinitions,
  SUCCESS_STATUS: '0x1',
  FAIL_STATUS: '0x0',
  FAUCET_AMOUNT: `${FAUCET_AMOUNT}`,
};

export type ProviderConfig = {
  rpcUrl: string;
  godAccount: Account;
  gas: string;
  gasPrice: string;
  nftRegistry: string;
  transactionTimeout: number;
  contractAddresses: ContractAddresses;
  contractAbis: ContractAbis;
  SUCCESS_STATUS: '0x1';
  FAIL_STATUS: '0x0';
  FAUCET_AMOUNT: string;
};

export default testConfig;
