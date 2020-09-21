import { Constructor, TinlakeParams, PendingTransaction } from '../Tinlake'
import { calculateOptimalSolution, State, OrderState, SolverSolution, SolverResult } from '../services/solver'
import BN from 'BN.js'
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

    setMinimumEpochTime = async (minEpochTime: string) => {
      return this.pending(this.contract('COORDINATOR').file(web3.fromAscii('minimumEpochTime').padEnd(66, '0'), minEpochTime, this.overrides))
    }

    setMinimumChallengeTime = async (challengeTime: string) => {
      return this.pending(this.contract('COORDINATOR').file(web3.fromAscii('challengeTime').padEnd(66, '0'), challengeTime, this.overrides))
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

    solveEpoch = async () => {
      const coordinator = this.contract('COORDINATOR')

      if ((await coordinator.submissionPeriod()) === false) {
        // The epoch is can be closed, but is not closed yet
        const closeTx = await coordinator.closeEpoch(this.overrides)
        const closeResult = await this.getTransactionReceipt(closeTx)
        console.log('close epoch done', closeResult)

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

      console.log(state)
      console.log(orderState)

      const solution = await calculateOptimalSolution(state, orderState)
      console.log('Solution found', solution)

      if (solution.status !== 5) {
        // TODO: rather than throw an error, we should return some kind of success message here
        throw new Error('Solution could not be found for the current epoch')
      }

      // TODO: we need to multiply these values by 10**18 and change them to BigInts

      throw new Error('to be completed')
      // return this.pending(coordinator.submitSolution(...Object.values(solution.vars), this.overrides))
    }

    executeEpoch = async () => {
      const coordinator = this.contract('COORDINATOR')
      if ((await this.getCurrentEpochState()) !== 'challenge-period-ended') {
        throw new Error('Current epoch is still in the challenge period')
      }

      return this.pending(coordinator.executeEpoch())
    }

    getCurrentEpochId = async () => {
      const coordinator = this.contract('COORDINATOR')
      return (await coordinator.currentEpoch()).toBN().toNumber()
    }

    getCurrentEpochMinimumTimeEnd = async () => {
      const coordinator = this.contract('COORDINATOR')

      const lastEpochClosed = (await coordinator.lastEpochClosed()).toBN().toNumber()
      const minimumEpochTime = (await coordinator.minimumEpochTime()).toBN().toNumber()

      return lastEpochClosed + minimumEpochTime
    }

    getCurrentEpochState = async () => {
      const coordinator = this.contract('COORDINATOR')

      const minChallengePeriodEnd = (await coordinator.minChallengePeriodEnd()).toBN().toNumber()
      const latestBlockTimestamp = (await this.provider.getBlock(await this.provider.getBlockNumber())).timestamp
      if (minChallengePeriodEnd !== 0) {
        if (minChallengePeriodEnd < latestBlockTimestamp) return 'challenge-period-ended'
        return 'in-challenge-period'
      }

      const lastEpochClosed = (await coordinator.lastEpochClosed()).toBN().toNumber()
      const minimumEpochTime = (await coordinator.minimumEpochTime()).toBN().toNumber()
      if (lastEpochClosed + minimumEpochTime < latestBlockTimestamp) {
        return 'can-be-closed'
      }

      const submissionPeriod = await coordinator.submissionPeriod()
      if (!submissionPeriod) return 'open'

      throw new Error('Arrived at impossible current epoch state')
    }
  }
}

export type EpochState = 'open' | 'can-be-closed' | 'in-challenge-period' | 'challenge-period-ended'

export type ICoordinatorActions = {
  getEpochState(): Promise<State>
  getOrderState(): Promise<OrderState>
  solveEpoch(): Promise<PendingTransaction>
  executeEpoch(): Promise<PendingTransaction>
  getCurrentEpochId(): Promise<number>
  getCurrentEpochMinimumTimeEnd(): Promise<number>
  getCurrentEpochState(): Promise<EpochState>
  setMinimumEpochTime(minEpochTime:string): Promise<PendingTransaction>
  setMinimumChallengeTime(minChallengeTime:string): Promise<PendingTransaction>
}

export default CoordinatorActions
