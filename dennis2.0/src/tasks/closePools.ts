import Tinlake from '@centrifuge/tinlake-js'
const BN = require('bn.js')
import { ethers } from 'ethers'
import config from '../config'
import { formatEvents, parseRatio } from '../util/formatEvents'
import { PoolMap } from '../util/ipfs'
import { pushNotificationToSlack } from '../util/slack'

const e18 = new BN('10').pow(new BN('18'))

export const closePools = async (pools: PoolMap, provider: ethers.providers.Provider, signer: ethers.Signer) => {
  console.log('Checking if any pools can be closed')
  for (let pool of Object.values(pools)) {
    if (!pool.addresses) return
    const tinlake: any = new Tinlake({ provider, signer, contractAddresses: pool.addresses })
    const id = await tinlake.getCurrentEpochId()
    const state = await tinlake.getCurrentEpochState()
    const name = pool.metadata.shortName || pool.metadata.name

    if (state === 'open' || state === 'challenge-period-ended') return

    const epochState = await tinlake.getEpochState(true)
    const orders = await tinlake.getOrders(true)

    if (state === 'can-be-closed') {
      const orderSum: any = Object.values(orders).reduce((prev: any, order) => prev.add(order), new BN('0'))

      if (orderSum.lte(e18)) {
        console.log(`There are no orders for ${name} yet, not closing`)
        return
      }

      const solution = await tinlake.runSolver(epochState, orders)
      const solutionSum = solution.dropInvest.add(solution.dropRedeem).add(solution.tinInvest).add(solution.tinRedeem)

      const fulfillment = solutionSum
        .mul(e18)
        .div(orderSum)
        .div(new BN('10').pow(new BN('14')))

      pushNotificationToSlack(
        `If epoch ${id} for *<${config.tinlakeUiHost}pool/${pool.addresses.ROOT_CONTRACT}/${
          pool.metadata.slug
        }|${name}>* is closed now, ${parseFloat(fulfillment.toString()) / 100} % of all orders could be fulfilled.`,
        formatEvents(epochState, solution, true)
      )

      if (solutionSum === orderSum) {
        // 100% fulfillment

        const solveTx = await tinlake.solveEpoch()
        console.log(`Closing & solving ${name} with tx: ${solveTx.hash}`)
        await tinlake.getTransactionReceipt(solveTx)

        // TODO: only push notification if immediately executed as well
        const currentTinRatio = parseRatio(await tinlake.getCurrentJuniorRatio())
        pushNotificationToSlack(
          `I just closed epoch ${id} for *<${config.tinlakeUiHost}pool/${pool.addresses.ROOT_CONTRACT}/${pool.metadata.slug}|${name}>*.`,
          formatEvents(epochState, orders, false, currentTinRatio),
          {
            title: 'View on Etherscan',
            url: `https://kovan.etherscan.io/tx/${solveTx.hash}`,
          }
        )
      }

      return
    }

    const solveTx = await tinlake.solveEpoch()
    console.log(`Solving ${name} with tx: ${solveTx.hash}`)
    await tinlake.getTransactionReceipt(solveTx)

    const currentTinRatio = parseRatio(await tinlake.getCurrentJuniorRatio())
    pushNotificationToSlack(
      `I just submit a solution to epoch ${id} for *<${config.tinlakeUiHost}pool/${pool.addresses.ROOT_CONTRACT}/${pool.metadata.slug}|${name}>*.`,
      formatEvents(epochState, orders, false, currentTinRatio),
      {
        title: 'View on Etherscan',
        url: `https://kovan.etherscan.io/tx/${solveTx.hash}`,
      }
    )
  }
}
