import { PendingTransaction } from '@centrifuge/tinlake-js'
import { ethers } from 'ethers'

class TransactionQueue {
  queue: { [key: string]: PendingTransaction } = {}

  constructor(provider: ethers.providers.Provider, signer: ethers.Signer) {
    this.watch(provider, signer)

    // TODO: run method every 5 min to increase gas prices
  }

  async watch(provider: ethers.providers.Provider, signer: ethers.Signer) {
    const filter = {
      address: await signer.getAddress(),
    }

    provider.on(filter, (result) => {
      console.log(result)
      // TODO: if result is the completion of a tx in this queue, remove it from the queue
    })
  }

  push(key: string, tx: PendingTransaction) {
    this.queue[key] = tx
  }
}

export default TransactionQueue
