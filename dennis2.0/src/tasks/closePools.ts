import Tinlake, { baseToDisplay, ITinlake, toPrecision, addThousandsSeparators } from '@centrifuge/tinlake-js'
import { Orders, State } from '@centrifuge/tinlake-js/dist/services/solver/solver'
const BN = require('bn.js')
import { ethers } from 'ethers'
import config from '../config'
import { PoolMap } from '../util/ipfs'
import { NotificationEvent, pushNotificationToSlack } from '../util/slack'

export const closePools = async (pools: PoolMap, provider: ethers.providers.Provider, signer: ethers.Signer) => {
  console.log('Checking if any pools can be closed or executed')
  for (let pool of Object.values(pools)) {
    if (!pool.addresses) return
    const tinlake: any = new Tinlake({ provider, signer, contractAddresses: pool.addresses })
    const id = await tinlake.getCurrentEpochId()
    const state = await tinlake.getCurrentEpochState()
    const name = pool.metadata.shortName || pool.metadata.name

    if (state === 'open') return

    if (state === 'challenge-period-ended') {
      const epochState = await tinlake.getEpochState()
      const orders = await tinlake.getOrders()

      const executeTx = await tinlake.executeEpoch()
      console.log(`Executing ${name} with tx: ${executeTx.hash}`)
      await tinlake.getTransactionReceipt(executeTx)

      const currentTinRatio = parseRatio(await tinlake.getCurrentJuniorRatio())
      pushNotificationToSlack(
        `I just executed epoch ${id} for *<${config.tinlakeUiHost}pool/${pool.addresses.ROOT_CONTRACT}/${pool.metadata.slug}|${name}>*.`,
        formatEvents(epochState, orders, currentTinRatio),
        {
          title: 'View on Etherscan',
          url: `https://kovan.etherscan.io/tx/${executeTx.hash}`,
        }
      )

      return
    }

    const epochState = await tinlake.getEpochState(false) // TODO: should be true
    const orders = await tinlake.getOrders(true)

    if (state === 'can-be-closed') {
      const orderSum: any = Object.values(orders).reduce((prev: any, order) => prev.add(order), new BN('0'))

      if (orderSum.lte(new BN(10).pow(new BN(18)))) {
        console.log(`There are no orders for ${name} yet, not closing`)
        return
      }

      const solution = await tinlake.runSolver(epochState, orders)
      const solutionSum: any = Object.values(solution).reduce((prev: any, result) => prev.add(result), new BN('0'))

      const fulfillment = solutionSum.mul(new BN('10').pow(new BN('18'))).div(orderSum)
      console.log(`fulfillment: ${fulfillment.toString()}`)

      return

      // TODO: calculate if a non zero solution can be found, and if not, return here
    }

    // const solveTx = await tinlake.solveEpoch()
    // console.log(`Closing & solving ${name} with tx: ${solveTx.hash}`)
    // await tinlake.getTransactionReceipt(solveTx)

    // // TODO: only push notification if immediately executed as well
    // const currentTinRatio = parseRatio(await tinlake.getCurrentJuniorRatio())
    // pushNotificationToSlack(
    //   `I just closed epoch ${id} for *<${config.tinlakeUiHost}pool/${pool.addresses.ROOT_CONTRACT}/${pool.metadata.slug}|${name}>*.`,
    //   formatEvents(epochState, orders, currentTinRatio),
    //   {
    //     title: 'View on Etherscan',
    //     url: `https://kovan.etherscan.io/tx/${solveTx.hash}`,
    //   }
    // )
  }
}

const formatEvents = (state: State, fulfilledOrders: Orders, currentTinRatio: number): NotificationEvent[] => {
  const minTinRatio = parseRatio(new BN(10).pow(new BN(27)).sub(state.maxDropRatio))
  // const reserveRatio = state.reserve.div(state.reserve.add(state.netAssetValue)).mul(new BN(100))

  return [
    {
      level: 'info',
      message: `DROP received ${addThousandsSeparators(
        toPrecision(baseToDisplay(fulfilledOrders.dropInvest, 18), 0)
      )} DAI in investments and  ${addThousandsSeparators(
        toPrecision(baseToDisplay(fulfilledOrders.dropRedeem, 18), 0)
      )} DAI was redeemed.`,
    },
    {
      level: 'info',
      message: `TIN received ${addThousandsSeparators(
        toPrecision(baseToDisplay(fulfilledOrders.tinInvest, 18), 0)
      )} DAI in investments and  ${addThousandsSeparators(
        toPrecision(baseToDisplay(fulfilledOrders.tinRedeem, 18), 0)
      )} DAI was redeemed.`,
    },
    {
      level: 'warning',
      message: `The reserve is ${addThousandsSeparators(
        toPrecision(baseToDisplay(state.reserve, 18), 0)
      )} DAI out of ${addThousandsSeparators(toPrecision(baseToDisplay(state.maxReserve, 18), 0))} DAI.`,
    },
    {
      level: 'warning',
      message: `The TIN risk buffer is ${Math.round(100 * currentTinRatio)} % (min: ${100 * minTinRatio} %).`,
    },
  ]
}

const parseRatio = (num: typeof BN): number => {
  const base = new BN(10).pow(new BN(20))
  return num.div(base).toNumber() / 10 ** 7
}
