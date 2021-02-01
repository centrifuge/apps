import Tinlake, { baseToDisplay, ITinlake, toPrecision, addThousandsSeparators } from '@centrifuge/tinlake-js'
import { Orders } from '@centrifuge/tinlake-js/dist/services/solver/solver'
const BN = require('bn.js')
import { ethers } from 'ethers'
import { PoolMap } from '../util/ipfs'
import { NotificationEvent, pushNotificationToSlack } from '../util/slack'

export const closePools = async (pools: PoolMap, provider: ethers.providers.Provider, signer: ethers.Signer) => {
  console.log('Checking if any pools can be closed or executed')
  for (let pool of Object.values(pools)) {
    if (!pool.addresses) return
    const tinlake: ITinlake = new Tinlake({ provider, signer, contractAddresses: pool.addresses })
    const id = await tinlake.getCurrentEpochId()
    const state = await tinlake.getCurrentEpochState()
    const name = pool.metadata.shortName || pool.metadata.name

    if (state === 'open') return

    const orders = await tinlake.getOrders()
    if (state === 'challenge-period-ended') {
      const executeTx = await tinlake.executeEpoch()
      console.log(`Executing ${name} with tx: ${executeTx.hash}`)
      await tinlake.getTransactionReceipt(executeTx)

      pushNotificationToSlack(`I just executed epoch ${id} for ${name}.`, formatEvents(orders), {
        title: 'View on Etherscan',
        url: `https://kovan.etherscan.io/tx/${executeTx.hash}`,
      })

      return
    }

    if (state === 'can-be-closed') {
      const orderSum: any = Object.values(orders).reduce((prev: any, order) => prev.add(order), new BN('0'))

      if (orderSum.isZero()) {
        console.log(`There are no orders for ${name} yet, not closing`)
        return
      }

      // TODO: calculate if a non zero solution can be found, and if not, return here
    }

    const solveTx = await tinlake.solveEpoch()
    console.log(`Closing & solving ${name} with tx: ${solveTx.hash}`)
    await tinlake.getTransactionReceipt(solveTx)

    // TODO: only push notification if immediately executed as well
    pushNotificationToSlack(`I just closed epoch ${id} for ${name}.`, formatEvents(orders), {
      title: 'View on Etherscan',
      url: `https://kovan.etherscan.io/tx/${solveTx.hash}`,
    })
  }
}

const formatEvents = (orders: Orders): NotificationEvent[] => {
  return [
    {
      level: 'info',
      message: `DROP received ${addThousandsSeparators(
        toPrecision(baseToDisplay(orders.dropInvest, 18), 0)
      )} DAI in investments and  ${addThousandsSeparators(
        toPrecision(baseToDisplay(orders.dropRedeem, 18), 0)
      )} DAI was redeemed.`,
    },
    {
      level: 'info',
      message: `TIN received ${addThousandsSeparators(
        toPrecision(baseToDisplay(orders.tinInvest, 18), 0)
      )} DAI in investments and  ${addThousandsSeparators(
        toPrecision(baseToDisplay(orders.tinRedeem, 18), 0)
      )} DAI was redeemed.`,
    },
  ]
}
