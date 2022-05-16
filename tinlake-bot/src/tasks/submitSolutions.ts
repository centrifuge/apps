import Tinlake from '@centrifuge/tinlake-js'
import { ethers } from 'ethers'
import { PoolMap } from '../util/ipfs'

export const submitSolutions = async (pools: PoolMap, provider: ethers.providers.Provider, signer: ethers.Signer) => {
  console.log('Checking if any solutions can be submitted')
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

      if (!(state === 'in-submission-period' || state === 'in-challenge-period')) continue

      const epochState = await tinlake.getEpochState(false)
      const orders = await tinlake.getOrders(false)

      const solution = await tinlake.runSolver(epochState, orders)
      const solutionScore = await tinlake.scoreSolution(solution)
      const bestScore = await tinlake.bestSubmissionScore()

      if (solutionScore.gt(bestScore)) {
        const solveTx = await tinlake.solveEpoch()
        console.log(`Solving ${name} with tx: ${solveTx.hash}`)
      } else {
        console.log(`${solutionScore.toString()} is not better than ${bestScore.toString()}`)
      }
    } catch (e) {
      console.error(`Error caught during solution submission task: ${e}`)
    }
  }
}
