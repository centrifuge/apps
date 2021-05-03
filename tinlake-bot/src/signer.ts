import { ethers } from 'ethers'
import * as WebSocket from 'ws'

const DEFAULT_CONFIG: BackendSignerConfig = {
  transactionTimeout: 1 * 60 * 1000, // 1 minute; TODO: 5 minutes
  gasnowWebsocketUrl: 'wss://www.gasnow.org/ws/gasprice',
  initialSpeed: 'slow', // TODO: standard
  increasedSpeed: 'fast',
  maxGasPriceAge: 10 * 60 * 1000, // 10 mins
  fallback: {
    maxIncreases: 3,
  },
}

/**
 * This signer blocks the same transaction from being sent twice, and retries transactions with higher gas prices over time.
 * It uses gas prices from the GasNow API, initially standard and increasing to fast for retries.
 */
class BackendSigner extends ethers.Signer {
  readonly signer: ethers.Signer

  private config: BackendSignerConfig

  history: { [key: string]: string | undefined } = {}

  latestGasPrices: GasPricesConfig | undefined = undefined

  constructor(signer: ethers.Signer, config?: BackendSignerConfig) {
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
    transaction: ethers.utils.Deferrable<ethers.providers.TransactionRequest>,
    increases?: number
  ): Promise<ethers.providers.TransactionResponse> {
    const key = `${transaction.to}-${transaction.data}`
    if (!increases && this.history[key]) {
      throw new Error(`Transaction ${key} already sent`)
    }

    const gasPrice =
      this.latestGasPrices && this.latestGasPrices.timestamp - Date.now() < this.config.maxGasPriceAge
        ? this.latestGasPrices.standard
        : await this.provider.getGasPrice()

    const response = await super.sendTransaction({ ...transaction, gasPrice })
    this.history[key] = response.hash

    // Purposefully not using await since it shouldnt block sendTransaction from returning
    this.watch(transaction, response.hash, response.nonce, increases || 0)

    return response
  }

  async watch(
    transaction: ethers.utils.Deferrable<ethers.providers.TransactionRequest>,
    hash: string,
    nonce: number,
    increases: number
  ) {
    if (!this.provider) {
      throw new Error('Provider for BackendSigner is not initialised')
    }

    try {
      console.log(`Watching ${hash}`)
      await this.provider.waitForTransaction(hash, undefined, this.config.transactionTimeout)

      const key = `${transaction.to}-${transaction.data}`
      this.history[key] = undefined
    } catch (e) {
      console.error(`Error caught while waiting for transaction: ${e}`)

      if (e.toString().includes('timeout exceeded')) {
        // Use the gasnow fast price if it's not too old, otherwise use 20% increasing over time.
        const initialGasPrice = await this.provider.getGasPrice()

        const newGasPrice =
          this.latestGasPrices && this.latestGasPrices.timestamp - Date.now() < this.config.maxGasPriceAge
            ? this.latestGasPrices.fast
            : initialGasPrice.add(
                initialGasPrice.div(5).mul(Math.min(increases + 1, this.config.fallback.maxIncreases))
              )
        const newTx = { ...transaction, nonce, gasPrice: newGasPrice }
        console.log(`Resubmitting with gas price of ${newGasPrice}`)
        this.sendTransaction(newTx, increases + 1)
      }
    }
  }

  /* @ts-ignore */
  get provider(): ethers.providers.Provider {
    return this.signer.provider
  }

  connect(provider: ethers.providers.Provider): BackendSigner {
    return new BackendSigner(this.signer.connect(provider))
  }

  getAddress(): Promise<string> {
    return this.signer.getAddress()
  }

  signMessage(message: ethers.Bytes | string): Promise<string> {
    return this.signer.signMessage(message)
  }

  signTransaction(transaction: ethers.utils.Deferrable<ethers.providers.TransactionRequest>): Promise<string> {
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

interface BackendSignerConfig {
  transactionTimeout: number
  gasnowWebsocketUrl: string
  initialSpeed: keyof GasPrices
  increasedSpeed: keyof GasPrices
  maxGasPriceAge: number
  fallback: {
    maxIncreases: number
  }
}

export { BackendSigner, BackendSignerConfig }
