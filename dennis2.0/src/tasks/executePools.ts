import Tinlake from '@centrifuge/tinlake-js'
const BN = require('bn.js')
import { ethers } from 'ethers'
import config from '../config'
import { formatEvents, parseRatio } from '../util/formatEvents'
import { PoolMap } from '../util/ipfs'
import { pushNotificationToSlack } from '../util/slack'

export const executePools = async (pools: PoolMap, provider: ethers.providers.Provider, signer: ethers.Signer) => {
  console.log('Checking if any pools can be executed')

  for (let pool of Object.values(pools)) {
    if (!pool.addresses) return
    const tinlake: any = new Tinlake({ provider, signer, contractAddresses: pool.addresses })
    const id = await tinlake.getCurrentEpochId()
    const state = await tinlake.getCurrentEpochState()
    const name = pool.metadata.shortName || pool.metadata.name

    if (state === 'challenge-period-ended') {
      const epochState = await tinlake.getEpochState()
      const orders = await tinlake.getOrders()

      const executeTx = await tinlake.executeEpoch()
      console.log(`Executing ${name} with tx: ${executeTx.hash}`)
      await tinlake.getTransactionReceipt(executeTx)

      // TODO: calculate actual fulfilled orders rather than requested orders

      const currentTinRatio = parseRatio(await tinlake.getCurrentJuniorRatio())
      pushNotificationToSlack(
        `I just executed epoch ${id} for *<${config.tinlakeUiHost}pool/${pool.addresses.ROOT_CONTRACT}/${pool.metadata.slug}|${name}>*.`,
        formatEvents(epochState, orders, false, currentTinRatio),
        {
          title: 'View on Etherscan',
          url: `https://kovan.etherscan.io/tx/${executeTx.hash}`,
        }
      )

      return
    }
  }
}
