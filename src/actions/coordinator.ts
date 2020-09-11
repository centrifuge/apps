import { Constructor, TinlakeParams, PendingTransaction } from '../Tinlake'
import { calculateOptimalSolution, State, OrderState, SolverSolution, SolverResult } from '../services/solver'

export function CoordinatorActions<ActionsBase extends Constructor<TinlakeParams>>(Base: ActionsBase) {
  return class extends Base implements ICoordinatorActions {

    getEpochState = async () => {
      const coordinator = this.contract('COORDINATOR')
      const assessor = this.contract('ASSESSOR')

      const state: State = {
        reserve: (await coordinator.epochReserve())
          .toBN()
          .div(10 ** 18)
          .toNumber(),
        netAssetValue: (await coordinator.epochNAV())
          .toBN()
          .div(10 ** 18)
          .toNumber(),
        seniorAsset: (await coordinator.epochSeniorAsset())
          .toBN()
          .div(10 ** 18)
          .toNumber(),
        minTinRatio:
          1.0 -
          (await coordinator.maxSeniorRatio())
            .toBN()
            .div(10 ** 27)
            .toNumber(),
        maxTinRatio:
          1.0 -
          (await coordinator.minSeniorRatio())
            .toBN()
            .div(10 ** 27)
            .toNumber(),
        maxReserve: (await assessor.maxReserve()).toBN().toNumber(),
      }

      return state
    }

    solveEpoch = async () => {
      const coordinator = this.contract('COORDINATOR')

      if (!(await coordinator.submissionPeriod())) {
        // The epoch is can be closed, but is not closed yet
        const closeTx = await coordinator.closeEpoch()
        await this.getTransactionReceipt(closeTx)

        // If it's not in a submission period after closing the epoch, then it could immediately be solved and executed
        // (i.e. all orders could be fulfilled)
        if (!(await coordinator.submissionPeriod())) return
      }

      const state = await this.getEpochState()

      const orderState = coordinator.order()

      const solution = await calculateOptimalSolution(state, orderState)
      console.log('Solution found', solution)

      if (solution.status !== 5) {
        console.error('Solution could not be found for the current epoch', { state, orderState })
        return undefined
      }

      // TODO: we need to multiply these values by 10**18 and change them to BigInts

      const submitTx = coordinator.submitSolution(...Object.values(solution.vars))
      const submitResult = await this.getTransactionReceipt(submitTx)

      console.log('Submit solver result', submitResult)

      return solution.vars

    }

    executeEpoch = async () => {
      const coordinator = this.contract('COORDINATOR')
      if ((await this.getCurrentEpochState()) !== 'challenge-period-ended') {
        throw new Error('Current epoch is still in the challenge period')
      }

      return this.pending(coordinator.executeEpoch())
    }

    getCurrentEpochState = async () => {
      const coordinator = this.contract('COORDINATOR')

      const lastEpochClosed =  (await coordinator.lastEpochClosed).toBN().toNumber()
      const minimumEpochTime = (await coordinator.minimumEpochTime).toBN().toNumber()
      if (((new Date()).getTime() - lastEpochClosed) >= minimumEpochTime) {
        return 'can-be-closed'
      }
      
      const submissionPeriod = await coordinator.submissionPeriod()
      if (!submissionPeriod) return 'open'

      const minChallengePeriodEnd = await coordinator.minChallengePeriodEnd
      if (minChallengePeriodEnd < (new Date).getTime()) return 'challenge-period-ended'

      return 'in-challenge-period'
    }
  }
}

export type EpochState = 'open' | 'can-be-closed' | 'in-challenge-period' | 'challenge-period-ended'

export type ICoordinatorActions = {
  getEpochState(): Promise<State>
  solveEpoch(): Promise<SolverSolution | undefined>
  executeEpoch(): Promise<PendingTransaction>
  getCurrentEpochState(): Promise<EpochState>
}

export default CoordinatorActions
