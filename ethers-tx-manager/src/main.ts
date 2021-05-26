import { ethers } from 'ethers'
import * as WebSocket from 'ws'

const DEFAULT_CONFIG: TransactionManagerConfig = {
  transactionTimeout: 5 * 60 * 1000, // 5 minutes
  gasnowWebsocketUrl: 'wss://www.gasnow.org/ws/gasprice',
  initialSpeed: 'standard',
  increasedSpeed: 'fast',
  minGasPriceIncrease: 10000000000, // 10 gwei
  maxGasPriceAge: 10 * 60 * 1000, // 10 mins
  filterDuplicates: true,
  fallback: {
    stepSize: 0.2, // 20% increase every time
    maxIncreases: 3,
  },
}

/**
 * This signer blocks the same transaction from being sent twice, and retries transactions with higher gas prices over time.
 * It uses gas prices from the GasNow API, initially standard and increasing to fast for retries.
 */
class TransactionManager extends ethers.Signer {
  readonly signer: ethers.Signer

  private config: TransactionManagerConfig

  latestGasPrices: GasPricesConfig | undefined = undefined

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

    const gasnowWs = new WebSocket(this.config.gasnowWebsocketUrl)
    gasnowWs.onmessage = (event: any) => {
      const data = JSON.parse(event.data)

      if (data.type) {
        this.latestGasPrices = data.data
      }
    }
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
    if (!(key in this.transactions)) {
      throw new Error(`${key} is not found in the transaction list`)
    }

    const request: ethers.providers.TransactionRequest = this.transactions[key].response
      ? { ...this.transactions[key].request, nonce: this.transactions[key].response.nonce }
      : this.transactions[key].request

    const initialGasPrice = await this.provider.getGasPrice()

    /**
     * Try to use the gasnow gas price, fallback to adding a preset step size to the initial price.
     * If the increased speed is not more than the previous gas price, default to adding the step size.
     */
    const gasPrice =
      this.latestGasPrices && this.latestGasPrices.timestamp - Date.now() < this.config.maxGasPriceAge
        ? increases === 0
          ? this.latestGasPrices[this.config.initialSpeed]
          : this.latestGasPrices[this.config.increasedSpeed]
        : initialGasPrice.add(
            initialGasPrice
              .div(1 / this.config.fallback.stepSize)
              .mul(Math.min(increases + 1, this.config.fallback.maxIncreases))
          )

    // TODO: this should be 10% minimum rather than a fixed gwei amount
    if (gasPrice < parseInt(request.gasPrice.toString()) + this.config.minGasPriceIncrease) {
      // Don't resubmit if these new gas price isn't a significant increase
      this.watch(key, increases || 0)
      return
    }

    const txWithGasPrice = { ...request, gasPrice }
    if (increases > 0) console.log(`Resubmitting ${this.transactions[key].response.hash} with gas price of ${gasPrice}`)

    const response = await super.sendTransaction({ ...txWithGasPrice, gasPrice })
    this.transactions[key] = { ...this.transactions[key], response }

    // Resolve the sendTransaction() call
    if (increases === 0 && this.transactions[key].resolve) await this.transactions[key].resolve(response)

    this.watch(key, increases || 0)
  }

  async watch(key: string, increases: number) {
    if (!this.provider) {
      throw new Error('Provider for TransactionManager is not initialised')
    }

    if (!this.transactions[key]?.response?.hash) {
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
      console.log(`Completed ${key}`)
      if (this.queue.length > 0) {
        console.log(`Moving on to ${key}`)
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
    return new TransactionManager(this.signer.connect(provider))
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

interface GasPrices {
  rapid: number
  fast: number
  standard: number
  slow: number
}

interface GasPricesConfig extends GasPrices {
  timestamp: number
}

interface TransactionManagerConfig {
  transactionTimeout: number
  gasnowWebsocketUrl: string
  initialSpeed: keyof GasPrices
  increasedSpeed: keyof GasPrices
  minGasPriceIncrease: number
  maxGasPriceAge: number
  filterDuplicates: boolean
  fallback: {
    stepSize: number
    maxIncreases: number
  }
}

export { GasPrices, GasPricesConfig, TransactionManagerConfig }

export default TransactionManager
