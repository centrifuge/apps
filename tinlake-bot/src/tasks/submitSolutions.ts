import Tinlake, { addThousandsSeparators, baseToDisplay, toPrecision } from '@centrifuge/tinlake-js'
import { ethers } from 'ethers'
import config from '../config'
import { formatEvents, parseRatio } from '../util/formatEvents'
import { PoolMap } from '../util/ipfs'
import { pushNotificationToSlack } from '../util/slack'

export const submitSolutions = async (pools: PoolMap, provider: ethers.providers.Provider, signer: ethers.Signer) => {
  console.log('Checking if any solutions can be submitted')
  for (let pool of Object.values(pools)) {
    if (!pool.addresses) continue
    const tinlake: any = new Tinlake({ provider, signer, contractAddresses: pool.addresses })
    const id = await tinlake.getCurrentEpochId()
    const state = await tinlake.getCurrentEpochState()
    const name = pool.metadata.shortName || pool.metadata.name

    if (!(state === 'in-submission-period' || state === 'in-challenge-period')) continue

    const epochState = await tinlake.getEpochState(false)
    const orders = await tinlake.getOrders(false)

    const solution = await tinlake.runSolver(epochState, orders)
    const solutionScore = await tinlake.scoreSolution(solution)
    const bestScore = await tinlake.bestSubmissionScore()

    if (solutionScore.gt(bestScore)) {
      const solveTx = await tinlake.solveEpoch()
      console.log(`Solving ${name} with tx: ${solveTx.hash}`)
      await tinlake.getTransactionReceipt(solveTx)

      pushNotificationToSlack(
        `I just submitted a solution for epoch ${id - 1} for *<${config.tinlakeUiHost}pool/${
          pool.addresses.ROOT_CONTRACT
        }/${pool.metadata.slug}|${name}>*.`,
        [
          {
            icon: 'drop',
            message: `DROP would receive ${addThousandsSeparators(
              toPrecision(baseToDisplay(solution.dropInvest, 18), 0)
            )} DAI in investments and ${addThousandsSeparators(
              toPrecision(baseToDisplay(solution.dropRedeem, 18), 0)
            )} DAI in redemptions.`,
          },
          {
            icon: 'tin',
            message: `DROP would receive ${addThousandsSeparators(
              toPrecision(baseToDisplay(solution.tinInvest, 18), 0)
            )} DAI in investments and ${addThousandsSeparators(
              toPrecision(baseToDisplay(solution.tinRedeem, 18), 0)
            )} DAI in redemptions.`,
          },
        ],
        {
          title: 'View on Etherscan',
          url: `https://kovan.etherscan.io/tx/${solveTx.hash}`,
        }
      )
    } else {
      console.log(`${solutionScore.toString()} is not better than ${bestScore.toString()}`)
    }
  }
}
