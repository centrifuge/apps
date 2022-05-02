import Tinlake, { addThousandsSeparators, baseToDisplay, toPrecision } from '@centrifuge/tinlake-js'
import { ethers } from 'ethers'
import config from '../config'
import { parseRatio } from '../util/formatEvents'
import { PoolMap } from '../util/ipfs'
import { pushNotificationToSlack } from '../util/slack'
const BN = require('bn.js')

export const executePools = async (pools: PoolMap, provider: ethers.providers.Provider, signer: ethers.Signer) => {
  console.log('Checking if any pools can be executed')

  for (let pool of Object.values(pools)) {
    try {
      if (!pool.addresses) continue
      const tinlake: any = new Tinlake({
        provider,
        signer,
        contractAddresses: pool.addresses,
        contractVersions: pool.versions,
      })
      const id = await tinlake.getCurrentEpochId()
      const state = await tinlake.getCurrentEpochState()
      const name = pool.metadata.shortName || pool.metadata.name

      if (state !== 'challenge-period-ended') continue

      const epochState = await tinlake.getEpochState()
      const orders = await tinlake.getOrders()

      const solution = await tinlake.runSolver(epochState, orders)

      const executeTx = await tinlake.executeEpoch()
      console.log(`Executing ${name} with tx: ${executeTx.hash}`)

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

      const currencySymbol = pool.metadata.currencySymbol || 'DAI'

      pushNotificationToSlack(
        pool,
        `I just executed epoch ${id - 1} for *<${config.tinlakeUiHost}pool/${pool.addresses.ROOT_CONTRACT}/${
          pool.metadata.slug
        }|${name}>*.`,
        [
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*DROP investments*\n${addThousandsSeparators(
                  toPrecision(baseToDisplay(solution.dropInvest, 18), 0)
                )} ${currencySymbol}`,
              },
              {
                type: 'mrkdwn',
                text: `*DROP redemptions*\n${addThousandsSeparators(
                  toPrecision(baseToDisplay(solution.dropRedeem, 18), 0)
                )} DROP`,
              },
              {
                type: 'mrkdwn',
                text: `*TIN investments*\n${addThousandsSeparators(
                  toPrecision(baseToDisplay(solution.tinInvest, 18), 0)
                )} ${currencySymbol}`,
              },
              {
                type: 'mrkdwn',
                text: `*TIN redemptions*\n${addThousandsSeparators(
                  toPrecision(baseToDisplay(solution.tinRedeem, 18), 0)
                )} TIN`,
              },
            ],
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `:moneybag: The new reserve is ${addThousandsSeparators(
                  toPrecision(baseToDisplay(newReserve, 18), 0)
                )} ${currencySymbol} out of ${addThousandsSeparators(
                  toPrecision(baseToDisplay(epochState.maxReserve, 18), 0)
                )} ${currencySymbol} max. The cash drag is ${parseFloat(cashdrag.toString()) / 100}%.`,
              },
              {
                type: 'mrkdwn',
                text: `:hand: The new TIN risk buffer is ${Math.round(
                  parseRatio(newTinRatio) * 100
                )}% (min: ${Math.round(parseRatio(minTinRatio) * 100)}%).`,
              },
              {
                type: 'mrkdwn',
                text: `:cyclone: The new pool value is ${addThousandsSeparators(
                  toPrecision(baseToDisplay(newReserve.add(epochState.netAssetValue), 18), 0)
                )} ${currencySymbol}.`,
              },
            ],
          },
        ],
        {
          title: 'View on Etherscan',
          url: `${config.etherscanUrl}/tx/${executeTx.hash}`,
        }
      )
    } catch (e) {
      console.error(`Error caught during pool execution task: ${e}`)
    }
  }
}
