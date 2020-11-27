import contractAddresses from './addresses.json'
import abiDefinitions from '../abi/'
import { ContractAddresses, ContractAbis } from '../Tinlake'
import dotenv from 'dotenv'
import { ethers } from 'ethers'

dotenv.config()

const MILLI_ETH = 1e15 // 0.001 ETH
const FAUCET_AMOUNT = 5000 * MILLI_ETH
const GAS_LIMIT = 2000000

const testConfig: ProviderConfig = {
  contractAddresses: (process.env.CONTRACTS && JSON.parse(process.env.CONTRACTS)) || contractAddresses,
  godAccount: new ethers.Wallet(
    process.env.GOD_PRIV_KEY || '0xb2e0c8e791c37df214808cdadc187f0cba0e36160f1a38b321a25c9a0cea8c11'
  ),
  nftRegistry: process.env.NFT_REGISTRY || '0xac0c1ef395290288028a0a9fdfc8fdebebe54a24',
  transactionTimeout: 50000,
  overrides: { gasLimit: GAS_LIMIT },
  rpcUrl: process.env.RPC_URL || 'http://127.0.0.1:8545',
  isRealTestnet: false,
  contractAbis: abiDefinitions,
  SUCCESS_STATUS: 1,
  FAIL_STATUS: 0,
  FAUCET_AMOUNT: `${FAUCET_AMOUNT}`,
}

testConfig.isRealTestnet = !testConfig.rpcUrl.includes('127.0.0.1') && !testConfig.rpcUrl.includes('localhost')

export type ProviderConfig = {
  rpcUrl: string
  isRealTestnet: boolean
  godAccount: ethers.Wallet
  nftRegistry: string
  transactionTimeout: number
  contractAddresses: ContractAddresses
  contractAbis: ContractAbis
  SUCCESS_STATUS: 1
  FAIL_STATUS: 0
  FAUCET_AMOUNT: string
  overrides: ethers.providers.TransactionRequest
}

export default testConfig
