import Tinlake, { ITinlake } from '@centrifuge/tinlake-js'
const BN = require('bn.js')
import { ethers } from 'ethers'
import { PoolMap } from '../util/ipfs'

export const closePools = async (pools: PoolMap, provider: ethers.providers.Provider, signer: ethers.Signer) => {
  console.log('Closing pools')
  for (let pool of Object.values(pools)) {
    if (!pool.addresses) return
    const tinlake: ITinlake = new Tinlake({ provider, signer, contractAddresses: pool.addresses })
    const state = await tinlake.getCurrentEpochState()
    console.log(`Pool ${pool.metadata.shortName || pool.metadata.name}: ${state}`)

    if (state === 'open') return

    if (state === 'challenge-period-ended') {
      const executeTx = await tinlake.executeEpoch()
      console.log(`Executing epoch with tx: ${executeTx.hash}`)
      await tinlake.getTransactionReceipt(executeTx)
      return
    }

    if (state === 'can-be-closed') {
      const orders = await tinlake.getOrders()
      const orderSum = Object.values(orders).reduce((prev, order) => prev.add(order), new BN('0'))

      if (orderSum.isZero()) {
        console.log(`No orders for ${pool.metadata.name} yet, not closing`)
        return
      }

      // TODO: calculate if a non zero solution can be found, and if not, return here
    }

    const solveTx = await tinlake.solveEpoch()
    console.log(`Closing & solving epoch with tx: ${solveTx.hash}`)
    await tinlake.getTransactionReceipt(solveTx)
  }
}
