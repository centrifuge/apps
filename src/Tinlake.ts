import abiDefinitions from './abi/v3'
import { ethers } from 'ethers'
import BN from 'bn.js'

const contractNames = [
  'COLLATERAL_NFT',
  'TITLE',
  'TINLAKE_CURRENCY',
  'SHELF',
  'COLLECTOR',
  'FEED',
  'JUNIOR_MEMBERLIST',
  'SENIOR_MEMBERLIST',
  'PILE',
  'DISTRIBUTOR',
  'ASSESSOR',
  'ROOT_CONTRACT',
  'JUNIOR_TOKEN',
  'SENIOR_TOKEN',
  'RESERVE',
  'PROXY',
  'PROXY_REGISTRY',
  'ACTIONS',
  'JUNIOR_OPERATOR',
  'SENIOR_OPERATOR',
  'JUNIOR_TRANCHE',
  'SENIOR_TRANCHE',
  'COORDINATOR',
] as const

export type PendingTransaction = {
  hash?: string
  status: number
  error?: string
  timesOutAt?: number
  // receipt: () => Promise<ethers.providers.TransactionReceipt>
}

export type ContractName = typeof contractNames[number]

export type Contracts = {
  [key in ContractName]?: ethers.Contract
}

export type ContractAbis = {
  [key in ContractName]?: (ethers.utils.EventFragment | ethers.utils.FunctionFragment)[]
}

export type ContractAddresses = {
  [key in ContractName]?: string
}

export type TinlakeParams = {
  provider: ethers.providers.Provider
  signer?: ethers.Signer
  legacyWeb3Provider?: ethers.providers.AsyncSendable
  transactionTimeout?: number
  contractAddresses?: ContractAddresses | {}
  contractAbis?: ContractAbis | {}
  overrides?: ethers.providers.TransactionRequest
  contracts?: Contracts | {}
  contractConfig?: any | {}
}

export type Constructor<T = {}> = new (...args: any[]) => Tinlake

ethers.errors.setLogLevel('error')

// This adds a .toBN() function to all BigNumber instances returned by ethers.js
;(ethers.utils.BigNumber as any).prototype.toBN = function () {
  return new BN((this as any).toString())
}

export default class Tinlake {
  public provider: ethers.providers.Provider
  public signer?: ethers.Signer
  public legacyWeb3Provider?: ethers.providers.AsyncSendable
  public overrides: ethers.providers.TransactionRequest = {}
  public contractAddresses: ContractAddresses
  public transactionTimeout: number
  public contracts: Contracts = {}
  public contractAbis: ContractAbis = {}
  public contractConfig: any = {}
  public readonly version: number = 3

  constructor(params: TinlakeParams) {
    const {
      provider,
      signer,
      legacyWeb3Provider,
      contractAddresses,
      transactionTimeout,
      contractAbis,
      overrides,
      contractConfig,
    } = params
    this.contractAbis = contractAbis || abiDefinitions
    this.contractConfig = contractConfig || {}
    this.contractAddresses = contractAddresses || {}
    this.transactionTimeout = transactionTimeout || 3600
    this.overrides = overrides || {}
    this.setProviderAndSigner(provider, signer, legacyWeb3Provider)
    this.setContracts()
  }

  setContracts = () => {
    // set root & proxy contracts
    contractNames.forEach((name) => {
      if (this.contractAbis[name] && this.contractAddresses[name]) {
        this.contracts[name] = this.createContract(this.contractAddresses[name]!, name)
      }
    })
  }

  setProviderAndSigner = (
    provider: ethers.providers.Provider,
    signer?: ethers.Signer,
    legacyWeb3Provider?: ethers.providers.AsyncSendable
  ) => {
    this.provider = provider
    this.signer = signer
    this.legacyWeb3Provider = legacyWeb3Provider
  }

  createContract(address: string, abiName: ContractName) {
    return new ethers.Contract(address, this.contractAbis[abiName]!, this.provider)
  }

  contract(abiName: keyof Tinlake['contracts'] | ContractName, address?: string) {
    const signerOrProvider = this.signer || this.provider
    if (!(abiName in this.contracts) && !(address && abiName in this.contractAbis)) {
      throw new Error(`Contract ${abiName} not loaded: ${JSON.stringify(Object.keys(this.contracts))}`)
    }

    if (address) {
      // If an address was passed, return a contract at that specific address
      return new ethers.Contract(address, this.contractAbis[abiName]!, signerOrProvider)
    }

    if (this.signer) {
      // Return the prespecified contract for that name, and connect it to the signer so that transactions can be initiated
      return this.contracts[abiName]!.connect(signerOrProvider)
    }

    // Return the prespecified contract for that name, without a signer, which means that you can only retrieve information, not initiate transactions
    return this.contracts[abiName]!
  }

  /**
   * Handle timeout and wait for transaction success/failure
   * @param txPromise
   */
  async pending(txPromise: Promise<ethers.providers.TransactionResponse>): Promise<PendingTransaction> {
    try {
      const tx = await txPromise
      const timesOutAt = Date.now() + this.transactionTimeout * 1000
      return {
        timesOutAt,
        status: 1,
        hash: tx.hash,
        //   receipt: async () => {
        //     return new Promise(async (resolve, reject) => {
        //       if (!tx.hash) return reject(tx)

        //       let timer: NodeJS.Timer | undefined = undefined
        //       if (timesOutAt) {
        //         timer = setTimeout(() => {
        //           return reject(`Transaction ${tx.hash} timed out at ${timesOutAt}`)
        //         }, timesOutAt - Date.now())
        //       }

        //       try {
        //         const receipt = await this.provider!.waitForTransaction(tx.hash)
        //         if (timer) clearTimeout(timer)

        //         return resolve(receipt)
        //       } catch (e) {
        //         if (timer) clearTimeout(timer)
        //         console.error(`Error caught in tinlake.getTransactionReceipt(): ${JSON.stringify(e)}`)
        //         return reject()
        //       }
        //     })
        //   },
      }
    } catch (e) {
      console.error(`Error caught in tinlake.pending(): ${JSON.stringify(e)}`)
      return {
        status: 0,
        error: e.message,
        // receipt: async () => {
        //   return Promise.reject('Error caught in tinlake.pending()')
        // },
      }
    }
  }

  async getTransactionReceipt(tx: PendingTransaction): Promise<ethers.providers.TransactionReceipt> {
    return new Promise(async (resolve, reject) => {
      if (!tx.hash) return reject(tx)

      let timer: NodeJS.Timer | undefined = undefined
      if (tx.timesOutAt) {
        timer = setTimeout(() => {
          return reject(`Transaction ${tx.hash} timed out at ${tx.timesOutAt}`)
        }, tx.timesOutAt - Date.now())
      }

      try {
        const receipt = await this.provider!.waitForTransaction(tx.hash)
        if (timer) clearTimeout(timer)

        return resolve(receipt)
      } catch (e) {
        console.error(`Error caught in tinlake.getTransactionReceipt(): ${JSON.stringify(e)}`)
        return reject()
      }
    })
  }

  // TODO: remove this with admin
  getOperatorType = (tranche: string) => {
    switch (tranche) {
      case 'senior':
        return this.contractConfig['SENIOR_OPERATOR']
      case 'junior':
        return this.contractConfig['JUNIOR_OPERATOR']
      default:
        return '_OPERATOR'
    }
  }
}
