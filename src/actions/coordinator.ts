import { Constructor, TinlakeParams, PendingTransaction } from '../Tinlake'
import { calculateOptimalSolution, State, OrderState, SolverSolution, SolverResult } from '../services/solver'
import BN from 'BN.js'

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

    solveEpoch = async () => {
      const coordinator = this.contract('COORDINATOR')

      if ((await coordinator.submissionPeriod()) === false) {
        // The epoch is can be closed, but is not closed yet
        const closeTx = await coordinator.closeEpoch()
        await this.getTransactionReceipt(closeTx)

        // If it's not in a submission period after closing the epoch, then it could immediately be solved and executed
        // (i.e. all orders could be fulfilled)
        if ((await coordinator.submissionPeriod()) === false) {
          throw new Error('Epoch was immediately executed')
        }
      }

      const state = await this.getEpochState()
      const orderState = await coordinator.order()

      const solution = await calculateOptimalSolution(state, orderState)
      console.log('Solution found', solution)

      if (solution.status !== 5) {
        throw new Error('Solution could not be found for the current epoch')
      }

      // TODO: we need to multiply these values by 10**18 and change them to BigInts

      return this.pending(coordinator.submitSolution(...Object.values(solution.vars)))
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

      const lastEpochClosed = (await coordinator.lastEpochClosed()).toBN().toNumber()
      const minimumEpochTime = (await coordinator.minimumEpochTime()).toBN().toNumber()
      if (new Date().getTime() - lastEpochClosed >= minimumEpochTime) {
        return 'can-be-closed'
      }

      const submissionPeriod = await coordinator.submissionPeriod()
      if (!submissionPeriod) return 'open'

      const minChallengePeriodEnd = await coordinator.minChallengePeriodEnd()
      if (minChallengePeriodEnd < new Date().getTime()) return 'challenge-period-ended'

      return 'in-challenge-period'
    }

    // V3 TODO: this should probably be a in a different file
    calcJuniorDisburse = async (user: string) => {
      return await this.contract('JUNIOR_TRANCHE')['calcDisburse(address)'](user)
    }

    calcSeniorDisburse = async (user: string) => {
      return await this.contract('SENIOR_TRANCHE')['calcDisburse(address)'](user)
    }
  }
}

export type EpochState = 'open' | 'can-be-closed' | 'in-challenge-period' | 'challenge-period-ended'

export type CalcDisburseResult = {
  payoutCurrencyAmount: BN
  payoutTokenAmount: BN
  remainingSupplyCurrency: BN
  remainingRedeemToken: BN
}

export type ICoordinatorActions = {
  getEpochState(): Promise<State>
  solveEpoch(): Promise<PendingTransaction>
  executeEpoch(): Promise<PendingTransaction>
  getCurrentEpochId(): Promise<number>
  getCurrentEpochMinimumTimeEnd(): Promise<number>
  getCurrentEpochState(): Promise<EpochState>
  calcJuniorDisburse(user: string): Promise<CalcDisburseResult>
  calcSeniorDisburse(user: string): Promise<CalcDisburseResult>
}

export default CoordinatorActions
