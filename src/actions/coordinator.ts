import { Constructor, TinlakeParams, PendingTransaction } from '../Tinlake'
import { calculateOptimalSolution, State, OrderState, SolverWeights } from '../services/solver'
import BN from 'bn.js'
const web3 = require('web3-utils')

export function CoordinatorActions<ActionsBase extends Constructor<TinlakeParams>>(Base: ActionsBase) {
  return class extends Base implements ICoordinatorActions {
    getEpochState = async () => {
      const coordinator = this.contract('COORDINATOR')
      const assessor = this.contract('ASSESSOR')

      /**
       * We divide all uint values by 10**18, in order to convert them to JS numbers. This induces some loss of precision,
       * but since we are currently using DAI as the ERC20 token, this isn't a big problem. We are also dividing the
       * ratios by 10**20, then converting them to numbers, and then dividing again by 10**7. This ultimately divides
       * the ratios by 10**27, which is the precision of these values on contract. However, BN.js doesn't support decimals,
       * so we basically limit the ratios to 7 decimals here.
       */
      const valueBase = new BN(10).pow(new BN(18))
      const ratioBase = new BN(10).pow(new BN(20))

      const reserveBN = (await coordinator.epochReserve()).toBN()
      const reserve = reserveBN.isZero() ? 0.0 : reserveBN.div(valueBase).toNumber()

      const netAssetValueBN = (await coordinator.epochNAV()).toBN()
      const netAssetValue = netAssetValueBN.isZero() ? 0.0 : netAssetValueBN.div(valueBase).toNumber()

      const seniorAssetBN = (await coordinator.epochSeniorAsset()).toBN()
      const seniorAsset = seniorAssetBN.isZero() ? 0.0 : seniorAssetBN.div(valueBase).toNumber()

      const maxDROPRatioBN = (await assessor.maxSeniorRatio()).toBN()
      const minTinRatio = maxDROPRatioBN.isZero() ? 1.0 : 1.0 - maxDROPRatioBN.div(ratioBase).toNumber() / 10 ** 7

      const minDROPRatioBN = (await assessor.minSeniorRatio()).toBN()
      const maxTinRatio = minDROPRatioBN.isZero() ? 1.0 : 1.0 - minDROPRatioBN.div(ratioBase).toNumber() / 10 ** 7

      const maxReserveBN = (await assessor.maxReserve()).toBN()
      const maxReserve = maxReserveBN.isZero() ? 0.0 : maxReserveBN.div(valueBase).toNumber()

      return { reserve, netAssetValue, seniorAsset, minTinRatio, maxTinRatio, maxReserve }
    }

    getOrderState = async () => {
      const coordinator = this.contract('COORDINATOR')
      const orderState = await coordinator.order()

      const valueBase = new BN(10).pow(new BN(18))

      return {
        dropRedeemOrder: orderState.seniorRedeem.toBN().isZero()
          ? 0.0
          : orderState.seniorRedeem.toBN().div(valueBase).toNumber(),
        tinRedeemOrder: orderState.juniorRedeem.toBN().isZero()
          ? 0.0
          : orderState.juniorRedeem.toBN().div(valueBase).toNumber(),
        tinInvestOrder: orderState.juniorSupply.toBN().isZero()
          ? 0.0
          : orderState.juniorSupply.toBN().div(valueBase).toNumber(),
        dropInvestOrder: orderState.seniorSupply.toBN().isZero()
          ? 0.0
          : orderState.seniorSupply.toBN().div(valueBase).toNumber(),
      }
    }

    getSolverWeights = async () => {
      const coordinator = this.contract('COORDINATOR')

      return {
        seniorRedeem: (await coordinator.weightSeniorRedeem()).toBN().toNumber(),
        juniorRedeem: (await coordinator.weightJuniorRedeem()).toBN().toNumber(),
        juniorSupply: (await coordinator.weightsJuniorSupply()).toBN().toNumber(),
        seniorSupply: (await coordinator.weightsSeniorSupply()).toBN().toNumber(),
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

      const state = await this.getEpochState()
      const orderState = await this.getOrderState()
      const weights = await this.getSolverWeights()

      console.log('State', state)
      console.log('Order State', orderState)
      console.log('Solver Weights', weights)

      const solution = await calculateOptimalSolution(state, orderState, weights)
      console.log('Solution found', solution)

      // Status 4 is a solution with all zeros, status 5 is a non-zero solution
      if (solution.status !== 4 && solution.status !== 5) {
        throw new Error('Solution could not be found for the current epoch')
      }

      const toUintValue = (num: number): string => {
        return new BN(num).mul(new BN(10).pow(new BN(18))).toString()
      }

      const submissionTx = coordinator.submitSolution(
        toUintValue(solution.vars.dropRedeem),
        toUintValue(solution.vars.tinRedeem),
        toUintValue(solution.vars.tinInvest),
        toUintValue(solution.vars.dropInvest),
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
      return (await this.provider.getBlock(await this.provider.getBlockNumber())).timestamp
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
      const latestBlockTimestamp = (await this.provider.getBlock(await this.provider.getBlockNumber())).timestamp
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
