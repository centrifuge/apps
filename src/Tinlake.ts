import Eth from 'ethjs'
import { ethI } from './services/ethereum'
import abiDefinitions from './abi'
import { ethers } from 'ethers'
import BN from 'bn.js'

const contractNames = [
  'TINLAKE_CURRENCY',
  'JUNIOR_OPERATOR',
  'JUNIOR',
  'JUNIOR_TOKEN',
  'SENIOR',
  'SENIOR_TOKEN',
  'SENIOR_OPERATOR',
  'DISTRIBUTOR',
  'ASSESSOR',
  'TITLE',
  'PILE',
  'SHELF',
  'CEILING',
  'COLLECTOR',
  'THRESHOLD',
  'PRICE_POOL',
  'COLLATERAL_NFT',
  'COLLATERAL_NFT_DATA',
  'ROOT_CONTRACT',
  'PROXY',
  'PROXY_REGISTRY',
  'ACTIONS',
  'BORROWER_DEPLOYER',
  'LENDER_DEPLOYER',
  'NFT_FEED',
  'GOVERNANCE',
  'ALLOWANCE_OPERATOR',
] as const

type AbiOutput = {
  name: string
  type: 'address' | 'uint256'
}

export type PendingTransaction = {
  hash: string | undefined
  timesOutAt?: number
}

export type EthConfig = {
  from?: string
  gasPrice?: string
  gas?: string
}

export type EthersOverrides = {
  gasPrice?: number
  gasLimit?: number
}

export type EthersConfig = {
  provider: ethers.providers.Provider
  signer: ethers.Signer
  overrides?: EthersOverrides
}

export type ContractName = typeof contractNames[number]

export type Contracts = {
  [key in ContractName]?: any
}

export type ContractAbis = {
  [key in ContractName]?: any
}

export type ContractAddresses = {
  [key in ContractName]?: string
}

export type TinlakeParams = {
  provider: any
  transactionTimeout: number
  contractAddresses?: ContractAddresses | {}
  contractAbis?: ContractAbis | {}
  ethConfig?: EthConfig
  ethersConfig?: EthersConfig
  ethOptions?: any | {}
  contracts?: Contracts | {}
  contractConfig?: any | {}
}

export type Constructor<T = {}> = new (...args: any[]) => Tinlake

;(ethers.utils.BigNumber as any).prototype.toBN = function () {
  return new BN((this as any).toString())
}

export default class Tinlake {
  public provider: any
  public eth: ethI
  public ethOptions: any
  public ethConfig: EthConfig
  public ethersConfig: EthersConfig
  public contractAddresses: ContractAddresses
  public transactionTimeout: number
  public contracts: Contracts = {}
  public ethersContracts: Contracts = {}
  public contractAbis: ContractAbis = {}
  public contractConfig: any = {}

  constructor(params: TinlakeParams) {
    const {
      provider,
      contractAddresses,
      transactionTimeout,
      contractAbis,
      ethOptions,
      ethConfig,
      ethersConfig,
      contractConfig,
    } = params
    if (!contractAbis) {
      this.contractAbis = abiDefinitions
    }

    this.contractConfig = contractConfig || {}
    this.contractAddresses = contractAddresses || {}
    this.transactionTimeout = transactionTimeout
    this.setProvider(provider, ethOptions)
    this.setEthConfig(ethConfig || {})
    this.setEthersConfig(ethersConfig)
  }

  setProvider = (provider: any, ethOptions?: any) => {
    this.provider = provider
    this.ethOptions = ethOptions || {}
    this.eth = new Eth(this.provider, this.ethOptions) as ethI

    this.setContracts()
  }

  setContracts = () => {
    // set root & proxy contracts
    contractNames.forEach((name) => {
      if (this.contractAbis[name] && this.contractAddresses[name]) {
        this.contracts[name] = this.eth.contract(this.contractAbis[name]).at(this.contractAddresses[name])

        if (this.ethersConfig) this.ethersContracts[name] = this.createContract(this.contractAddresses[name]!, name)
      }
    })

    // modular contracts
    if (this.contractAddresses['JUNIOR_OPERATOR']) {
      this.contracts['JUNIOR_OPERATOR'] = this.contractConfig['JUNIOR_OPERATOR']
        ? this.createEthContract(this.contractAddresses['JUNIOR_OPERATOR'], this.contractConfig['JUNIOR_OPERATOR'])
        : this.createEthContract(this.contractAddresses['JUNIOR_OPERATOR'], 'ALLOWANCE_OPERATOR')

      if (this.ethersConfig) {
        this.ethersContracts['JUNIOR_OPERATOR'] = this.contractConfig['JUNIOR_OPERATOR']
          ? this.createContract(this.contractAddresses['JUNIOR_OPERATOR'], this.contractConfig['JUNIOR_OPERATOR'])
          : this.createContract(this.contractAddresses['JUNIOR_OPERATOR'], 'ALLOWANCE_OPERATOR')
      }
    }
    if (this.contractAddresses['SENIOR_OPERATOR']) {
      this.contracts['SENIOR_OPERATOR'] = this.contractConfig['SENIOR_OPERATOR']
        ? this.createEthContract(this.contractAddresses['SENIOR_OPERATOR'], this.contractConfig['SENIOR_OPERATOR'])
        : this.createEthContract(this.contractAddresses['SENIOR_OPERATOR'], 'ALLOWANCE_OPERATOR')

      if (this.ethersConfig) {
        this.ethersContracts['SENIOR_OPERATOR'] = this.contractConfig['SENIOR_OPERATOR']
          ? this.createContract(this.contractAddresses['SENIOR_OPERATOR'], this.contractConfig['SENIOR_OPERATOR'])
          : this.createContract(this.contractAddresses['SENIOR_OPERATOR'], 'ALLOWANCE_OPERATOR')
      }
    }
  }

  setEthConfig = (ethConfig: EthConfig) => {
    this.ethConfig = {
      ...this.ethConfig,
      ...ethConfig,
    }
  }

  setEthersConfig = (ethersConfig: EthersConfig | undefined) => {
    this.ethersConfig = {
      ...this.ethersConfig,
      ...ethersConfig,
    }
  }

  createEthContract(address: string, abiName: ContractName) {
    const contract = this.eth.contract(this.contractAbis[abiName]).at(address)
    return contract
  }

  createContract(address: string, abiName: ContractName) {
    return new ethers.Contract(address, this.contractAbis[abiName], this.ethersConfig.provider)
  }

  getContract(address: string, abiName: ContractName): ethers.Contract {
    return new ethers.Contract(address, this.contractAbis[abiName], this.ethersConfig.signer)
  }

  contract(abiName: ContractName, address?: string): ethers.Contract {
    if (address) {
      return new ethers.Contract(address, this.contractAbis[abiName], this.ethersConfig.signer)
    }
    return this.ethersContracts[abiName]
  }

  async pending(txPromise: Promise<ethers.providers.TransactionResponse>): Promise<PendingTransaction> {
    const tx = await txPromise
    return {
      hash: tx.hash,
      timesOutAt: Date.now() + this.transactionTimeout * 1000,
    }
  }

  async getTransactionReceipt(tx: PendingTransaction): Promise<ethers.providers.TransactionReceipt> {
    return new Promise(async (resolve, reject) => {
      if (!tx.hash) return reject()

      let timer: NodeJS.Timer | undefined = undefined
      if (tx.timesOutAt) {
        timer = setTimeout(() => {
          return reject()
        }, tx.timesOutAt - Date.now())
      }

      const receipt = await this.ethersConfig.provider!.waitForTransaction(tx.hash)
      if (timer) clearTimeout(timer)
      return resolve(receipt)
    })
  }

  getOperatorType = (tranche: string) => {
    switch (tranche) {
      case 'senior':
        return this.contractConfig['SENIOR_OPERATOR'] || 'ALLOWANCE_OPERATOR'
      case 'junior':
        return this.contractConfig['SENIOR_OPERATOR'] || 'ALLOWANCE_OPERATOR'
      default:
        return 'ALLOWANCE_OPERATOR'
    }
  }
}
