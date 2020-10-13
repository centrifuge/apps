import { Constructor, TinlakeParams, PendingTransaction } from '../Tinlake'
import { calculateOptimalSolution, State, OrderState, SolverWeights } from '../services/solver'
import BN from 'bn.js'
import { ethers } from 'ethers'
const web3 = require('web3-utils')

/**
 * We divide all uint values by 10**5, in order to convert them to valid JS numbers, and then by 10**13. This induces some loss
 * precision, but since we are currently using DAI as the ERC20 token, this isn't a big problem. We are also dividing the
 * ratios by 10**20, then converting them to numbers, and then dividing again by 10**7. This ultimately divides
 * the ratios by 10**27, which is the precision of these values on contract. However, BN.js doesn't support decimals,
 * so we basically limit the ratios to 7 decimals here.
 */
const uintToNumber = (uint: ethers.utils.BigNumber) =>
  (uint as any)
    .toBN()
    .div(new BN(10).pow(new BN(6)))
    .toNumber() /
  10 ** 12
const fixed27ToNumber = (fixed27: ethers.utils.BigNumber) =>
  (fixed27 as any)
    .toBN()
    .div(new BN(10).pow(new BN(20)))
    .toNumber() /
  10 ** 7

const numberToUint = (num: number): string => {
  return new BN(num * 10**12).mul(new BN(10).pow(new BN(6))).toString()
}

export function CoordinatorActions<ActionsBase extends Constructor<TinlakeParams>>(Base: ActionsBase) {
  return class extends Base implements ICoordinatorActions {
    getEpochState = async () => {
      const coordinator = this.contract('COORDINATOR')
      const assessor = this.contract('ASSESSOR')

      const reserve = uintToNumber(await coordinator.epochReserve())
      const netAssetValue = uintToNumber(await coordinator.epochNAV())
      const seniorAsset = uintToNumber(await coordinator.epochSeniorAsset())
      const minTinRatio = 1.0 - fixed27ToNumber(await assessor.maxSeniorRatio())
      const maxTinRatio = 1.0 - fixed27ToNumber(await assessor.minSeniorRatio())
      const maxReserve = uintToNumber(await assessor.maxReserve())

      return { reserve, netAssetValue, seniorAsset, minTinRatio, maxTinRatio, maxReserve }
    }

    getOrderState = async () => {
      const coordinator = this.contract('COORDINATOR')
      const orderState = await coordinator.order()

      return {
        dropRedeemOrder: uintToNumber(orderState.seniorRedeem),
        tinRedeemOrder: uintToNumber(orderState.juniorRedeem),
        tinInvestOrder: uintToNumber(orderState.juniorSupply),
        dropInvestOrder: uintToNumber(orderState.seniorSupply),
      }
    }

    getSolverWeights = async () => {
      const coordinator = this.contract('COORDINATOR')

      return {
        seniorRedeem: (await coordinator.weightSeniorRedeem()).toBN().toNumber(),
        juniorRedeem: (await coordinator.weightJuniorRedeem()).toBN().toNumber(),
        juniorSupply: (await coordinator.weightJuniorSupply()).toBN().toNumber(),
        seniorSupply: (await coordinator.weightSeniorSupply()).toBN().toNumber(),
      }
    }

    solveEpoch = async () => {
      const coordinator = this.contract('COORDINATOR')

      if ((await coordinator.submissionPeriod()) === false) {
        // The epoch is can be closed, but is not closed yet
        const closeTx = await coordinator.closeEpoch(this.overrides)
        const closeResult = await this.getTransactionReceipt(closeTx)

        if (closeResult.status === 0) {
          console.log('Failed to close the epoch')
          return { status: 0, error: 'Unable to close the epoch', hash: closeResult.transactionHash } as any
        }

        // If it's not in a submission period after closing the epoch, then it could immediately be solved and executed
        // (i.e. all orders could be fulfilled)
        if ((await coordinator.submissionPeriod()) === false) {
          console.log('Epoch was immediately executed')
          return { status: 1, hash: closeResult.transactionHash } as any
        }
      }
      console.log('Retrieving epoch state')
      const state = await this.getEpochState()
      console.log('Retrieving order state')
      const orderState = await this.getOrderState()
      console.log('Retrieving solver weights')
      const weights = await this.getSolverWeights()

      console.log('State', state)
      console.log('Order state', orderState)
      console.log('Solver weights', weights)

      const solution = await calculateOptimalSolution(state, orderState, weights)
      console.log('Solution found', solution)

      // Status 4 is a solution with all zeros, status 5 is a non-zero solution
      if (solution.status !== 4 && solution.status !== 5) {
        throw new Error('Solution could not be found for the current epoch')
      }

      const validationScore = (
        await coordinator.validate(
          numberToUint(solution.vars.dropRedeem),
          numberToUint(solution.vars.tinRedeem),
          numberToUint(solution.vars.tinInvest),
          numberToUint(solution.vars.dropInvest)
        )
      )
        .toBN()
        .toNumber()

      if (validationScore !== 0) {
        console.error(`Solution is not valid: ${validationScore}`)
      }

      const submissionTx = coordinator.submitSolution(
        numberToUint(solution.vars.dropRedeem),
        numberToUint(solution.vars.tinRedeem),
        numberToUint(solution.vars.tinInvest),
        numberToUint(solution.vars.dropInvest),
        this.overrides
      )

      return this.pending(submissionTx)
    }

    executeEpoch = async () => {
      const coordinator = this.contract('COORDINATOR')
      if ((await this.getCurrentEpochState()) !== 'challenge-period-ended') {
        throw new Error('Current epoch is still in the challenge period')
      }

      return this.pending(coordinator.executeEpoch(this.overrides))
    }

    getCurrentEpochId = async () => {
      const coordinator = this.contract('COORDINATOR')
      return (await coordinator.currentEpoch()).toBN().toNumber()
    }

    getLatestBlockTimestamp = async () => {
      const latestBlock = await this.provider.getBlock(await this.provider.getBlockNumber())
      if (!latestBlock) return new Date().getTime()
      return latestBlock.timestamp
    }

    getLastEpochClosed = async () => {
      const coordinator = this.contract('COORDINATOR')
      return (await coordinator.lastEpochClosed()).toBN().toNumber()
    }

    getMinimumEpochTime = async () => {
      const coordinator = this.contract('COORDINATOR')
      return (await coordinator.minimumEpochTime()).toBN().toNumber()
    }

    getMinChallengePeriodEnd = async () => {
      const coordinator = this.contract('COORDINATOR')
      return (await coordinator.minChallengePeriodEnd()).toBN().toNumber()
    }

    getSubmissionPeriod = async () => {
      return await this.contract('COORDINATOR').submissionPeriod()
    }

    getChallengeTime = async () => {
      return (await this.contract('COORDINATOR').challengeTime()).toBN()
    }

    getCurrentEpochState = async () => {
      const coordinator = this.contract('COORDINATOR')

      const minChallengePeriodEnd = (await coordinator.minChallengePeriodEnd()).toBN().toNumber()
      const latestBlockTimestamp = await this.getLatestBlockTimestamp()
      if (minChallengePeriodEnd !== 0) {
        if (minChallengePeriodEnd < latestBlockTimestamp) return 'challenge-period-ended'
        return 'in-challenge-period'
      }

      const submissionPeriod = await coordinator.submissionPeriod()
      if (submissionPeriod === true) {
        return 'in-submission-period'
      }

      const lastEpochClosed = (await coordinator.lastEpochClosed()).toBN().toNumber()
      const minimumEpochTime = (await coordinator.minimumEpochTime()).toBN().toNumber()
      if (submissionPeriod === false) {
        if (lastEpochClosed + minimumEpochTime < latestBlockTimestamp) return 'can-be-closed'
        return 'open'
      }

      throw new Error('Arrived at impossible current epoch state')
    }

    setMinimumEpochTime = async (minEpochTime: string) => {
      return this.pending(
        this.contract('COORDINATOR').file(
          web3.fromAscii('minimumEpochTime').padEnd(66, '0'),
          minEpochTime,
          this.overrides
        )
      )
    }

    setMinimumChallengeTime = async (challengeTime: string) => {
      return this.pending(
        this.contract('COORDINATOR').file(
          web3.fromAscii('challengeTime').padEnd(66, '0'),
          challengeTime,
          this.overrides
        )
      )
    }
  }
}

export type EpochState =
  | 'open'
  | 'can-be-closed'
  | 'in-submission-period'
  | 'in-challenge-period'
  | 'challenge-period-ended'

export type ICoordinatorActions = {
  getEpochState(): Promise<State>
  getOrderState(): Promise<OrderState>
  getSolverWeights(): Promise<SolverWeights>
  solveEpoch(): Promise<PendingTransaction>
  executeEpoch(): Promise<PendingTransaction>
  getCurrentEpochId(): Promise<number>
  getLatestBlockTimestamp(): Promise<number>
  getLastEpochClosed(): Promise<number>
  getMinimumEpochTime(): Promise<number>
  getMinChallengePeriodEnd(): Promise<number>
  getSubmissionPeriod(): Promise<boolean>
  getChallengeTime(): Promise<BN>
  getCurrentEpochState(): Promise<EpochState>
  setMinimumEpochTime(minEpochTime: string): Promise<PendingTransaction>
  setMinimumChallengeTime(minChallengeTime: string): Promise<PendingTransaction>
}

export default CoordinatorActions
