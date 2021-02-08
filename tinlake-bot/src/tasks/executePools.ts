import Tinlake, { addThousandsSeparators, baseToDisplay, toPrecision } from '@centrifuge/tinlake-js'
const BN = require('bn.js')
import { ethers } from 'ethers'
import config from '../config'
import { parseRatio } from '../util/formatEvents'
import { PoolMap } from '../util/ipfs'
import { pushNotificationToSlack } from '../util/slack'

export const executePools = async (pools: PoolMap, provider: ethers.providers.Provider, signer: ethers.Signer) => {
  console.log('Checking if any pools can be executed')

  for (let pool of Object.values(pools)) {
    if (!pool.addresses) continue
    const tinlake: any = new Tinlake({ provider, signer, contractAddresses: pool.addresses })
    const id = await tinlake.getCurrentEpochId()
    const state = await tinlake.getCurrentEpochState()
    const name = pool.metadata.shortName || pool.metadata.name

    if (state !== 'challenge-period-ended') continue

    const epochState = await tinlake.getEpochState()
    const orders = await tinlake.getOrders()

    const solution = await tinlake.runSolver(epochState, orders)

    const executeTx = await tinlake.executeEpoch()
    console.log(`Executing ${name} with tx: ${executeTx.hash}`)
    await tinlake.getTransactionReceipt(executeTx)

    // TODO: calculate actual fulfilled orders rather than requested orders (instead of running the solver)

    const e18 = new BN('10').pow(new BN('18'))
    const e27 = new BN(1).mul(new BN(10).pow(new BN(27)))
    const newSeniorAsset = epochState.seniorAsset.add(solution.dropInvest).sub(solution.dropRedeem)
    const newReserve = epochState.reserve
      .add(solution.dropInvest)
      .add(solution.tinInvest)
      .sub(solution.dropRedeem)
      .sub(solution.tinRedeem)

    const newTinRatio = e27.sub(newSeniorAsset.mul(e27).div(epochState.netAssetValue.add(newReserve)))
    const minTinRatio = e27.sub(epochState.maxDropRatio)

    const cashdrag = newReserve
      .mul(e18)
      .div(newReserve.add(epochState.netAssetValue))
      .div(new BN('10').pow(new BN('14')))

    pushNotificationToSlack(
      `I just executed epoch ${id - 1} for *<${config.tinlakeUiHost}pool/${pool.addresses.ROOT_CONTRACT}/${
        pool.metadata.slug
      }|${name}>*.`,
      [
        {
          icon: 'drop',
          message: `DROP received ${addThousandsSeparators(
            toPrecision(baseToDisplay(solution.dropInvest, 18), 0)
          )} DAI in investments and ${addThousandsSeparators(
            toPrecision(baseToDisplay(solution.dropRedeem, 18), 0)
          )} DAI in redemptions.`,
        },
        {
          icon: 'tin',
          message: `TIN received ${addThousandsSeparators(
            toPrecision(baseToDisplay(solution.tinInvest, 18), 0)
          )} DAI in investments and ${addThousandsSeparators(
            toPrecision(baseToDisplay(solution.tinRedeem, 18), 0)
          )} DAI in redemptions.`,
        },
        { icon: 'vertical_traffic_light', message: `The new cash drag is ${parseFloat(cashdrag.toString()) / 100}%.` },
        {
          icon: 'moneybag',
          message: `The new reserve is ${addThousandsSeparators(
            toPrecision(baseToDisplay(newReserve, 18), 0)
          )} DAI out of ${addThousandsSeparators(toPrecision(baseToDisplay(epochState.maxReserve, 18), 0))} DAI max.`,
        },
        {
          icon: 'hand',
          message: `The new TIN risk buffer is ${Math.round(parseRatio(newTinRatio) * 100)}% (min: ${Math.round(
            parseRatio(minTinRatio) * 100
          )}%).`,
        },
      ],
      {
        title: 'View on Etherscan',
        url: `https://kovan.etherscan.io/tx/${executeTx.hash}`,
      }
    )
  }
}
