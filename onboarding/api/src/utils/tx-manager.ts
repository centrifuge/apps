import { ethers } from 'ethers'

const DEFAULT_CONFIG: TransactionManagerConfig = {
  transactionTimeout: 5 * 60 * 1000, // 5 minutes
  maxFeePerGas: 200,
  initialPriorityFeePerGas: 2,
  maxPriorityFeePerGas: 20,
  priorityFeeIncrease: 1,
  filterDuplicates: true,
}

/**
 * This signer blocks the same transaction from being sent twice, and retries transactions with higher gas prices over time.
 * It uses gas prices from the GasNow API, initially standard and increasing to fast for retries.
 */
class TransactionManager extends ethers.Signer {
  readonly signer: ethers.Signer

  private config: TransactionManagerConfig

  transactions: {
    [key: string]:
      | {
          request: ethers.providers.TransactionRequest
          response?: ethers.providers.TransactionResponse
          resolve?: Function
          reject?: Function
        }
      | undefined
  } = {}
  queue: string[] = []

  constructor(signer: ethers.Signer, config?: Partial<TransactionManagerConfig>) {
    super()
    ethers.utils.defineReadOnly(this, 'signer', signer)
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  async sendTransaction(
    transaction: ethers.providers.TransactionRequest,
    increases?: number
  ): Promise<ethers.providers.TransactionResponse> {
    return new Promise(async (resolve, reject) => {
      const key = `${transaction.to}-${transaction.data}`
      if (this.config.filterDuplicates && !increases && this.transactions[key]) {
        throw new Error(`Transaction ${key} already sent`)
      }
      this.transactions[key] = { request: transaction, resolve, reject }
      this.queue.push(key)

      if (this.queue.length === 1) {
        console.log(`Processing ${key} immediately`)
        this.process(key)
      } else {
        console.log(`Adding ${key} to the queue`)
      }
    })
  }

  async process(key: string, increases: number = 0) {
    const request: ethers.providers.TransactionRequest = this.transactions[key].response
      ? { ...this.transactions[key].request, nonce: this.transactions[key].response.nonce }
      : this.transactions[key].request

    const maxPriorityFeePerGas = this.config.initialPriorityFeePerGas + increases * this.config.priorityFeeIncrease

    if (maxPriorityFeePerGas > this.config.maxPriorityFeePerGas) {
      // Don't resubmit if the new fee is larger than then max fee
      this.watch(key, increases || 0)
      return
    }

    const txWithFee = {
      ...request,
      maxFeePerGas: ethers.utils.parseUnits(String(this.config.maxFeePerGas), 'gwei'),
      maxPriorityFeePerGas: ethers.utils.parseUnits(String(maxPriorityFeePerGas), 'gwei'),
    }
    console.log(`Submitting ${key} with max priority fee of ${maxPriorityFeePerGas}`)
    if (increases > 0)
      console.log(
        `Resubmitting ${this.transactions[key].response.hash} with max priority fee of ${maxPriorityFeePerGas}`
      )

    try {
      const response = await super.sendTransaction(txWithFee)
      this.transactions[key] = { ...this.transactions[key], response }

      // Resolve the sendTransaction() call
      if (increases === 0 && this.transactions[key].resolve) await this.transactions[key].resolve(response)

      this.watch(key, increases || 0)
    } catch (e) {
      if (increases > 0) {
        // Keep watching previous transaction
        console.log(`Failed to resubmit ${this.transactions[key].response.hash} with ${maxPriorityFeePerGas}`)
        this.watch(key, increases || 0)
      } else {
        throw new Error(`Failed to submit tx with ${maxPriorityFeePerGas}: ${e}`)
      }
    }
  }

  async watch(key: string, increases: number) {
    if (!this.provider) {
      throw new Error('Provider for TransactionManager is not initialised')
    }

    if (!this.transactions[key].response?.hash) {
      throw new Error(`Transaction response missing for ${key}`)
    }

    try {
      console.log(`Watching ${this.transactions[key].response?.hash}`)
      await this.provider.waitForTransaction(
        this.transactions[key].response?.hash,
        undefined,
        this.config.transactionTimeout
      )

      this.queue = this.queue.slice(1)
      this.transactions[key] = undefined
      if (this.queue.length > 0) {
        this.process(this.queue[0])
      }
    } catch (e) {
      console.error(`Error caught while waiting for transaction: ${e}`)

      if (e.toString().includes('timeout exceeded')) {
        this.process(key, increases + 1)
      }
    }
  }

  /* @ts-ignore */
  get provider(): ethers.providers.Provider {
    return this.signer.provider
  }

  connect(provider: ethers.providers.Provider): TransactionManager {
    return new TransactionManager(this.signer.connect(provider), this.config)
  }

  getAddress(): Promise<string> {
    return this.signer.getAddress()
  }

  signMessage(message: ethers.Bytes | string): Promise<string> {
    return this.signer.signMessage(message)
  }

  signTransaction(transaction: ethers.providers.TransactionRequest): Promise<string> {
    return this.signer.signTransaction(transaction)
  }
}

interface TransactionManagerConfig {
  transactionTimeout: number
  maxFeePerGas: number
  initialPriorityFeePerGas: number
  maxPriorityFeePerGas: number
  priorityFeeIncrease: number
  filterDuplicates: boolean
}

export { TransactionManager, TransactionManagerConfig }
