import Tinlake, { addThousandsSeparators, baseToDisplay, toPrecision } from '@centrifuge/tinlake-js'
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
    if (!pool.addresses) continue
    const tinlake: any = new Tinlake({ provider, signer, contractAddresses: pool.addresses })
    const id = await tinlake.getCurrentEpochId()
    const state = await tinlake.getCurrentEpochState()
    const name = pool.metadata.shortName || pool.metadata.name

    if (state !== 'can-be-closed') continue

    const epochState = await tinlake.getEpochState(true)
    const orders = await tinlake.getOrders(true)

    const orderSum: any = Object.values(orders).reduce((prev: any, order) => prev.add(order), new BN('0'))

    if (orderSum.lte(e18)) {
      console.log(`There are no orders for ${name} yet, not closing`)
      continue
    }

    const solution = await tinlake.runSolver(epochState, orders)
    const solutionSum = solution.dropInvest.add(solution.dropRedeem).add(solution.tinInvest).add(solution.tinRedeem)

    const fulfillment = solutionSum
      .mul(e18)
      .div(orderSum)
      .div(new BN('10').pow(new BN('14')))

    if (solutionSum === orderSum) {
      // If 100% fulfillment is possible, close the epoch

      const solveTx = await tinlake.solveEpoch()
      console.log(`Closing & solving ${name} with tx: ${solveTx.hash}`)
      await tinlake.getTransactionReceipt(solveTx)

      const currentTinRatio = parseRatio(await tinlake.getCurrentJuniorRatio())
      pushNotificationToSlack(
        `I just closed epoch ${id} for *<${config.tinlakeUiHost}pool/${pool.addresses.ROOT_CONTRACT}/${pool.metadata.slug}|${name}>*.`,
        formatEvents(epochState, orders, false, currentTinRatio),
        {
          title: 'View on Etherscan',
          url: `https://kovan.etherscan.io/tx/${solveTx.hash}`,
        }
      )
    } else {
      // Otherwise, just notify the team
      const e27 = new BN(1).mul(new BN(10).pow(new BN(27)))
      const tinRatio = e27.sub(epochState.seniorAsset.mul(e27).div(epochState.netAssetValue.add(epochState.reserve)))
      const minTinRatio = e27.sub(epochState.maxDropRatio)
      pushNotificationToSlack(
        `Epoch ${id} for *<${config.tinlakeUiHost}pool/${pool.addresses.ROOT_CONTRACT}/${pool.metadata.slug}|${name}>* can be closed.`,
        [
          {
            message: `Approximately ${parseFloat(fulfillment.toString()) / 100}% of all orders could be fulfilled.`,
          },
          {
            icon: 'drop',
            message: `There are ${addThousandsSeparators(
              toPrecision(baseToDisplay(orders.dropInvest, 18), 0)
            )} DAI in DROP investments and ${addThousandsSeparators(
              toPrecision(baseToDisplay(orders.dropRedeem, 18), 0)
            )} DAI in DROP redemptions locked.`,
          },
          {
            icon: 'tin',
            message: `There are ${addThousandsSeparators(
              toPrecision(baseToDisplay(orders.tinInvest, 18), 0)
            )} DAI in TIN investments and ${addThousandsSeparators(
              toPrecision(baseToDisplay(orders.tinRedeem, 18), 0)
            )} DAI in TIN redemptions locked.`,
          },
          {
            icon: 'moneybag',
            message: `The current reserve is ${addThousandsSeparators(
              toPrecision(baseToDisplay(epochState.reserve, 18), 0)
            )} DAI out of ${addThousandsSeparators(toPrecision(baseToDisplay(epochState.maxReserve, 18), 0))} DAI max.`,
          },
          {
            icon: 'hand',
            message: `The current TIN risk buffer is ${Math.round(parseRatio(tinRatio) * 100)}% (min: ${Math.round(
              parseRatio(minTinRatio) * 100
            )}%).`,
          },
        ]
      )
    }
  }
}
