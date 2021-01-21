import BN from 'bn.js'
import { calculateOptimalSolution, Orders, SolverWeights, State } from '../services/solver'
import { Constructor, PendingTransaction, TinlakeParams } from '../Tinlake'
const web3 = require('web3-utils')

const numberToUint = (num: number): string => {
  return new BN(num * 10 ** 12).mul(new BN(10).pow(new BN(6))).toString()
}

export function CoordinatorActions<ActionsBase extends Constructor<TinlakeParams>>(Base: ActionsBase) {
  return class extends Base implements ICoordinatorActions {
    getEpochState = async () => {
      const e27 = new BN(1).mul(new BN(10).pow(new BN(27)))
      const coordinator = this.contract('COORDINATOR')
      const assessor = this.contract('ASSESSOR')

      const reserve = await this.toBN(coordinator.epochReserve())
      const netAssetValue = await this.toBN(coordinator.epochNAV())
      const seniorAsset = await this.toBN(coordinator.epochSeniorAsset())
      const minTinRatio = e27.sub(await this.toBN(assessor.maxSeniorRatio()))
      const maxTinRatio = e27.sub(await this.toBN(assessor.minSeniorRatio()))
      const maxReserve = await this.toBN(assessor.maxReserve())

      return { reserve, netAssetValue, seniorAsset, minTinRatio, maxTinRatio, maxReserve }
    }

    getOrders = async () => {
      const coordinator = this.contract('COORDINATOR')
      const orderState = await coordinator.order()

      return {
        dropRedeem: await this.toBN(orderState.seniorRedeem),
        tinRedeem: await this.toBN(orderState.juniorRedeem),
        tinInvest: await this.toBN(orderState.juniorSupply),
        dropInvest: await this.toBN(orderState.seniorSupply),
      }
    }

    getSolverWeights = async () => {
      const coordinator = this.contract('COORDINATOR')

      return {
        dropRedeem: await this.toBN(coordinator.weightSeniorRedeem()),
        tinRedeem: await this.toBN(coordinator.weightJuniorRedeem()),
        tinInvest: await this.toBN(coordinator.weightJuniorSupply()),
        dropInvest: await this.toBN(coordinator.weightSeniorSupply()),
      }
    }

    solveEpoch = async () => {
      const coordinator = this.contract('COORDINATOR')

      if ((await coordinator.submissionPeriod()) === false) {
        // The epoch is can be closed, but is not closed yet
        const closeTx = await coordinator.closeEpoch({ ...this.overrides, gasLimit: 700000 })
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
      console.log('Retrieving orders')
      const orders = await this.getOrders()
      console.log('Retrieving solver weights')
      const weights = await this.getSolverWeights()

      console.log('State', state)
      console.log('Orders', orders)
      console.log('Solver weights', weights)

      const solution = await calculateOptimalSolution(state, orders, weights)
      console.log('Solution found', solution)

      const validationScore = (
        await coordinator.validate(
          solution.vars.dropRedeem,
          solution.vars.tinRedeem,
          solution.vars.tinInvest,
          solution.vars.dropInvest
        )
      )
        .toBN()
        .toNumber()

      if (validationScore !== 0) {
        console.error(`Solution is not valid: ${validationScore}`)
      }

      const submissionTx = coordinator.submitSolution(
        solution.vars.dropRedeem,
        solution.vars.tinRedeem,
        solution.vars.tinInvest,
        solution.vars.dropInvest,
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
      return (await this.toBN(coordinator.currentEpoch())).toNumber()
    }

    getLatestBlockTimestamp = async () => {
      const latestBlock = await this.provider.getBlock(await this.provider.getBlockNumber())
      if (!latestBlock) return new Date().getTime()
      return latestBlock.timestamp
    }

    getLastEpochClosed = async () => {
      const coordinator = this.contract('COORDINATOR')
      return (await this.toBN(coordinator.lastEpochClosed())).toNumber()
    }

    getMinimumEpochTime = async () => {
      const coordinator = this.contract('COORDINATOR')
      return (await this.toBN(coordinator.minimumEpochTime())).toNumber()
    }

    getMinChallengePeriodEnd = async () => {
      const coordinator = this.contract('COORDINATOR')
      return (await this.toBN(coordinator.minChallengePeriodEnd())).toNumber()
    }

    getSubmissionPeriod = async () => {
      return await this.contract('COORDINATOR').submissionPeriod()
    }

    getChallengeTime = async () => {
      return await this.toBN(this.contract('COORDINATOR').challengeTime())
    }

    getCurrentEpochState = async () => {
      const coordinator = this.contract('COORDINATOR')

      const minChallengePeriodEnd = (await this.toBN(coordinator.minChallengePeriodEnd())).toNumber()
      const latestBlockTimestamp = await this.getLatestBlockTimestamp()
      if (minChallengePeriodEnd !== 0) {
        if (minChallengePeriodEnd < latestBlockTimestamp) return 'challenge-period-ended'
        return 'in-challenge-period'
      }

      const submissionPeriod = await coordinator.submissionPeriod()
      if (submissionPeriod === true) {
        return 'in-submission-period'
      }

      const lastEpochClosed = (await this.toBN(coordinator.lastEpochClosed())).toNumber()
      const minimumEpochTime = (await this.toBN(coordinator.minimumEpochTime())).toNumber()
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
  getOrders(): Promise<Orders>
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
