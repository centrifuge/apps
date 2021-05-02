import { ethers } from 'ethers'
import config from './config'
import * as WebSocket from 'ws'

const TX_TIMEOUT = 5 * 60 * 1000 // 5 mins
const MAX_INCREASES = 3
const MAX_GASPRICE_AGE = 10 * 60 * 1000 // 10 mins

/**
 * This signer blocks the same transaction from being sent twice, and retries transactions with higher gas prices over time.
 * It uses gas prices from the GasNow API, initially standard and increasing to fast for retries.
 *
 * TODO: use gasnow price standard on the first sendTransaction already
 */
class RetryingSigner extends ethers.Signer {
  readonly signer: ethers.Signer

  history: { [key: string]: string | undefined } = {}

  latestGasPrices: GasPrices | undefined = undefined

  constructor(signer: ethers.Signer) {
    super()
    ethers.utils.defineReadOnly(this, 'signer', signer)

    const gasnowWs = new WebSocket(config.gasnowWs)
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

    const response = await super.sendTransaction(transaction)
    this.history[key] = response.hash

    // Purposefully not using await since it shouldnt block sendTransaction from returning
    this.watch(transaction, response.hash, increases || 0)

    return response
  }

  async watch(
    transaction: ethers.utils.Deferrable<ethers.providers.TransactionRequest>,
    hash: string,
    increases: number
  ) {
    if (!this.provider) {
      throw new Error('Provider for RetryingSigner is not initialised')
    }

    try {
      console.log(`Watching ${hash}`)
      await this.provider.waitForTransaction(hash, undefined, TX_TIMEOUT)

      const key = `${transaction.to}-${transaction.data}`
      this.history[key] = undefined
    } catch (e) {
      console.error(`Error caught while waiting for transaction: ${e}`)

      if (e.toString().includes('timeout exceeded')) {
        const initialGasPrice = await this.provider.getGasPrice()
        // Use the gasnow fast price if it's not too old, otherwise use 20% increasing over time.
        const newGasPrice =
          this.latestGasPrices && this.latestGasPrices.timestamp - Date.now() < MAX_GASPRICE_AGE
            ? this.latestGasPrices.fast
            : initialGasPrice.add(initialGasPrice.div(5).mul(Math.min(increases + 1, MAX_INCREASES)))
        const newTx = { ...transaction, gasPrice: newGasPrice, nonce: transaction.nonce }
        console.log(`Resubmitting with gas price of ${newGasPrice}`)
        this.sendTransaction(newTx, increases + 1)
      }
    }
  }

  /* @ts-ignore */
  get provider(): ethers.providers.Provider {
    return this.signer.provider
  }

  connect(provider: ethers.providers.Provider): RetryingSigner {
    return new RetryingSigner(this.signer.connect(provider))
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

export { RetryingSigner }

interface GasPrices {
  rapid: number
  fast: number
  standard: number
  slow: number
  timestamp: number
}
