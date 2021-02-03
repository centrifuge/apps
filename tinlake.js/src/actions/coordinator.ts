import BN from 'bn.js'
import { calculateOptimalSolution, Orders, SolverResult, SolverWeights, State } from '../services/solver/solver'
import { Constructor, PendingTransaction, TinlakeParams } from '../Tinlake'
const web3 = require('web3-utils')

export function CoordinatorActions<ActionsBase extends Constructor<TinlakeParams>>(Base: ActionsBase) {
  return class extends Base implements ICoordinatorActions {
    getEpochState = async (beforeClosing?: boolean) => {
      const coordinator = this.contract('COORDINATOR')
      const assessor = this.contract('ASSESSOR')

      // If beforeClosing is true, calculate the values as if the epoch would be closed now
      const reserve = await this.toBN(
        beforeClosing ? this.contract('RESERVE').totalBalance() : coordinator.epochReserve()
      )
      const netAssetValue = await this.toBN(beforeClosing ? assessor.calcUpdateNAV() : coordinator.epochNAV())
      const seniorAsset = beforeClosing
        ? (await this.toBN(assessor.seniorDebt())).add(await this.toBN(assessor.seniorBalance()))
        : await this.toBN(coordinator.epochSeniorAsset())

      const minDropRatio = await this.toBN(assessor.minSeniorRatio())
      const maxDropRatio = await this.toBN(assessor.maxSeniorRatio())
      const maxReserve = await this.toBN(assessor.maxReserve())

      return { reserve, netAssetValue, seniorAsset, minDropRatio, maxDropRatio, maxReserve }
    }

    getOrders = async (beforeClosing?: boolean) => {
      const coordinator = this.contract('COORDINATOR')
      const orderState = await coordinator.order()

      if (beforeClosing) {
        const seniorTranche = this.contract('SENIOR_TRANCHE')
        const juniorTranche = this.contract('JUNIOR_TRANCHE')

        // TODO: redeem values should be multiplied by token price
        return {
          dropInvest: await this.toBN(seniorTranche.totalSupply()),
          dropRedeem: await this.toBN(seniorTranche.totalRedeem()),
          tinInvest: await this.toBN(juniorTranche.totalSupply()),
          tinRedeem: await this.toBN(juniorTranche.totalRedeem()),
        }
      }

      return {
        dropInvest: await this.toBN(orderState.seniorSupply),
        dropRedeem: await this.toBN(orderState.seniorRedeem),
        tinInvest: await this.toBN(orderState.juniorSupply),
        tinRedeem: await this.toBN(orderState.juniorRedeem),
      }
    }

    getSolverWeights = async () => {
      const coordinator = this.contract('COORDINATOR')

      return {
        dropInvest: await this.toBN(coordinator.weightSeniorSupply()),
        dropRedeem: await this.toBN(coordinator.weightSeniorRedeem()),
        tinInvest: await this.toBN(coordinator.weightJuniorSupply()),
        tinRedeem: await this.toBN(coordinator.weightJuniorRedeem()),
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

      const solution = await this.runSolver(state, orders)
      Object.keys(solution).forEach((key: string) => {
        console.log(`\t${key}: ${(solution as any)[key].toString()}`)
      })

      if (!solution.isFeasible) {
        throw new Error('Failed to find a solution')
      }

      console.log('Solution found', solution)
      const submissionTx = coordinator.submitSolution(
        solution.dropRedeem.toString(),
        solution.tinRedeem.toString(),
        solution.tinInvest.toString(),
        solution.dropInvest.toString(),
        this.overrides
      )

      return this.pending(submissionTx)
    }

    runSolver = async (state: State, orders: Orders) => {
      const weights = await this.getSolverWeights()

      console.log(`\n\t- State`)
      Object.keys(state).forEach((key: string) => {
        console.log(`\t${key}: ${(state as any)[key].toString()}`)
      })
      console.log(`\n\t- Orders`)
      Object.keys(orders).forEach((key: string) => {
        console.log(`\t${key}: ${(orders as any)[key].toString()}`)
      })
      const solution = await calculateOptimalSolution(state, orders, weights)

      console.log(`\n\t- Solution`)
      Object.keys(solution).forEach((key: string) => {
        console.log(`\t${key}: ${(solution as any)[key].toString()}`)
      })

      if (!solution.isFeasible) {
        throw new Error('Failed to find a solution')
      }

      console.log('Solution found', solution)
      return solution
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
  getEpochState(beforeClosing?: boolean): Promise<State>
  getOrders(beforeClosing?: boolean): Promise<Orders>
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
  runSolver(state: State, orders: Orders): Promise<SolverResult>
}

export default CoordinatorActions
