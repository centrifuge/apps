import { Constructor, TinlakeParams } from '../Tinlake'

export function CoordinatorActions<ActionsBase extends Constructor<TinlakeParams>>(Base: ActionsBase) {
  return class extends Base implements ICoordinatorActions {

    solveEpoch = async () => {
      const coordinator = this.contract('COORDINATOR')
      const assessor = this.contract('ASSESSOR')

      if (!(await coordinator.submissionPeriod)) {
        // The epoch is can be closed, but is not closed yet
        const closeTx = await coordinator.closeEpoch()
        await this.getTransactionReceipt(closeTx)

        // If it's not in a submission period after closing the epoch, then it could immediately be solved and executed
        // (i.e. all orders could be fulfilled)
        if (!(await coordinator.submissionPeriod)) return
      }

      const state = {
        reserve: await coordinator.epochReserve, // coordinator.epochReserve
        netAssetValue: await coordinator.epochNAV, // coordinator.epochNAV
        seniorAsset: await coordinator.epochSeniorAsset,
        minTinRatio: 1 - (await assessor.maxSeniorRatio), // 1 - maxSeniorRatio on the assessor
        maxTinRatio: 1 - (await assessor.minSeniorRatio), // 1 - mSeniorRatio on the assessor
        maxReserve: await assessor.maxReserve, // assessor.maxReserve
      }

      const orderState = coordinator.order

      const solution = await this.calculateOptimalSolution(state, orderState)
      console.log('Solution found', solution)

      if (solution.status !== 5) {
        console.error('Solution could not be found for the current epoch', { state, orderState })
        return undefined
      }

      const submitTx = coordinator.submitSolution(...Object.values(solution.vars))
      const submitResult = await this.getTransactionReceipt(submitTx)

      console.log('Submit solver result', submitResult)

      return solution.vars

    }

    executeEpoch = async () => {
      const coordinator = this.contract('COORDINATOR')
      const submissionPeriod = await coordinator.submissionPeriod

      if (!submissionPeriod) throw new Error('Current epoch is not in a submission period')
      if (await this.isInChallengePeriod()) throw new Error('Current epoch is still in the challenge period')

      return this.pending(coordinator.executeEpoch())
    }

    // getCurrentEpochState = async () => {
    //   const coordinator = this.contract('COORDINATOR')

    //   const submissionPeriod = await coordinator.submissionPeriod
    //   if (!submissionPeriod) return 'active'

    //   const minChallengePeriodEnd = await coordinator.minChallengePeriodEnd
    //   if (minChallengePeriodEnd >= (new Date).getTime()) return 'challenge-period-ended'

    //   return 'in-challenge-period'
    // }

    isInChallengePeriod = async () => {
      const coordinator = this.contract('COORDINATOR')

      const submissionPeriod = await coordinator.submissionPeriod
      if (!submissionPeriod) throw new Error('Current epoch is not in a submission period')

      const minChallengePeriodEnd = await coordinator.minChallengePeriodEnd
      if (minChallengePeriodEnd >= (new Date).getTime()) return false // challenge period has ended

      return true // still in challenge period
    }

    calculateOptimalSolution = async (state: State, orderState: OrderState): Promise<SolverResult> => {
      /**
       * The limitations are:
       * - only input variables (those in state or orderState) can be on the right side of the constraint (the bnds key)
       * - only output variables ([dropRedeem,tinRedeem,tinInvest,dropInvest]) can be on the left side of the constraint (the vars key)
       * - variables can have coefficients, but there's no option for brackets or other more advanced equation forms
       *   (e.g. it's limited to a * x_1 + b * x_2 + ..., where [a,b] are coefficients and [x_1,x_2] are variables)
       * - larger than or equals, less than or equals, and equals constraints are all allowed ([<=,>=,=])
       */
      return require('glpk.js').then((glpk: any) => {
        const lp = {
          name: 'LP',
          generals: ['dropRedeem', 'tinRedeem', 'tinInvest', 'dropInvest'],
          objective: {
            // Maximize: dropRedeem > tinRedeem > tinInvest > dropInvest
            direction: glpk.GLP_MAX,
            name: 'obj',
            vars: [
              { name: 'dropRedeem', coef: 10000 },
              { name: 'tinRedeem', coef: 1000 },
              { name: 'tinInvest', coef: 100 },
              { name: 'dropInvest', coef: 10 },
            ],
          },
          subjectTo: [
            {
              name: 'currencyAvailable',
              vars: [
                { name: 'tinInvest', coef: 1.0 },
                { name: 'dropInvest', coef: 1.0 },
                { name: 'tinRedeem', coef: -1.0 },
                { name: 'dropRedeem', coef: -1.0 },
              ],
              bnds: { type: glpk.GLP_LO, ub: 0.0, lb: -state.reserve },
            },
            {
              name: 'dropRedeemOrder',
              vars: [{ name: 'dropRedeem', coef: 1.0 }],
              bnds: { type: glpk.GLP_UP, ub: orderState.dropRedeemOrder, lb: 0.0 },
            },
            {
              name: 'tinRedeemOrder',
              vars: [{ name: 'tinRedeem', coef: 1.0 }],
              bnds: { type: glpk.GLP_UP, ub: orderState.tinRedeemOrder, lb: 0.0 },
            },
            {
              name: 'dropInvestOrder',
              vars: [{ name: 'dropInvest', coef: 1.0 }],
              bnds: { type: glpk.GLP_UP, ub: orderState.dropInvestOrder, lb: 0.0 },
            },
            {
              name: 'tinInvestOrder',
              vars: [{ name: 'tinInvest', coef: 1.0 }],
              bnds: { type: glpk.GLP_UP, ub: orderState.tinInvestOrder, lb: 0.0 },
            },
            {
              name: 'maxReserve',
              vars: [
                { name: 'tinRedeem', coef: -1.0 },
                { name: 'dropRedeem', coef: -1.0 },
                { name: 'tinInvest', coef: 1.0 },
                { name: 'dropInvest', coef: 1.0 },
              ],
              bnds: { type: glpk.GLP_UP, ub: state.maxReserve - state.reserve, lb: 0.0 },
            },
            /**
             * The next tow constraints were rewritten from the original equations in the epoch model.
             * For one, minTINRatio was rewritten as a lower bound, which means both sides were multiplied by -1.
             * Secondly, all output vars were moved to the left side, while all input vars were moved to the right side.
             *
             * E.g. for dropRedeem, in the epoch model there's both -I4*(1-B7) and +I4.
             * So: -I4*(1-B7) + I4 = -0.8 I4 + 1.0 I4 = 0.2 I4 = minTinRatio * dropRedeem.
             */
            {
              name: 'minTINRatio',
              vars: [
                { name: 'tinRedeem', coef: -(1 - state.minTinRatio) },
                { name: 'dropRedeem', coef: state.minTinRatio },
                { name: 'tinInvest', coef: 1 - state.minTinRatio },
                { name: 'dropInvest', coef: -state.minTinRatio },
              ],
              bnds: {
                type: glpk.GLP_LO,
                ub: 0.0,
                lb:
                  -(1 - state.minTinRatio) * state.netAssetValue -
                  (1 - state.minTinRatio) * state.reserve +
                  state.seniorAsset,
              },
            },
            {
              name: 'maxTINRatio',
              vars: [
                { name: 'tinInvest', coef: -(1 - state.maxTinRatio) },
                { name: 'dropInvest', coef: state.maxTinRatio },
                { name: 'tinRedeem', coef: 1 - state.maxTinRatio },
                { name: 'dropRedeem', coef: -state.maxTinRatio },
              ],
              bnds: {
                type: glpk.GLP_LO,
                ub: 0.0,
                lb:
                  (1 - state.maxTinRatio) * state.netAssetValue +
                  (1 - state.maxTinRatio) * state.reserve -
                  state.seniorAsset,
              },
            },
          ],
        }

        const output = glpk.solve(lp, glpk.GLP_MSG_ERR)
        return output.result
      })
    }
  }
}

export type ICoordinatorActions = {
  solveEpoch(): Promise<SolverSolution | undefined>
  calculateOptimalSolution(state: State, orderState: OrderState): Promise<SolverResult>
}

export default CoordinatorActions

export interface State {
  netAssetValue: number
  reserve: number
  seniorAsset: number
  minTinRatio: number
  maxTinRatio: number
  maxReserve: number
}

export interface OrderState {
  tinRedeemOrder: number
  dropRedeemOrder: number
  tinInvestOrder: number
  dropInvestOrder: number
}

export interface SolverSolution {
  tinRedeem: number
  dropRedeem: number
  tinInvest: number
  dropInvest: number
}

export interface SolverResult {
  z: number
  status: number
  vars: SolverSolution
}
