import { Constructor, TinlakeParams } from '../Tinlake'

export function CoordinatorActions<ActionsBase extends Constructor<TinlakeParams>>(Base: ActionsBase) {
  return class extends Base implements ICoordinatorActions {
    solveEpoch = async () => {
      // const tinlake = (this as any)
      // const reserve = (await tinlake.getJuniorReserve()).add(await tinlake.getSeniorReserve())

      // const state = {
      //   reserve,
      //   netAssetValue: 0,
      //   seniorDebt: await tinlake.getSeniorDebt(),
      //   seniorBalance: 0,
      //   minTinRatio: await tinlake.getMinJuniorRatio(),
      //   maxTinRatio: 0,
      //   maxReserve: 0,
      // }
      
      return Promise.resolve({
          tinRedeem: 1,
          dropRedeem: 2,
          tinInvest: 3,
          dropInvest: 4
      })
    }

    calculateOptimalSolution = async (state: State, orderState: OrderState) => {
      return require('glpk.js').then((glpk: any) => {
        const lp = {
          name: 'LP',
          generals: ['dropRedeem', 'tinRedeem', 'tinInvest', 'dropInvest'],
          objective: {
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
                  state.seniorBalance +
                  state.seniorDebt,
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
                  state.seniorBalance -
                  state.seniorDebt,
              },
            },
          ],
        }

        const output = glpk.solve(lp, glpk.GLP_MSG_ALL)
        return output.result
      })
    }
  }
}

export type ICoordinatorActions = {
  solveEpoch(): Promise<SolverSolution>
  calculateOptimalSolution(state: State, orderState: OrderState): Promise<SolverResult>
}

export default CoordinatorActions

interface BaseState {
  netAssetValue: number
  reserve: number
  seniorDebt: number
  seniorBalance: number
}

export interface State extends BaseState {
  netAssetValue: number
  reserve: number
  seniorDebt: number
  seniorBalance: number
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
