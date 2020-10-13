/**
 * The limitations are:
 * - only input variables (those in state or orderState) can be on the right side of the constraint (the bnds key)
 * - only output variables ([dropRedeem,tinRedeem,tinInvest,dropInvest]) can be on the left side of the constraint (the vars key)
 * - variables can have coefficients, but there's no option for brackets or other more advanced equation forms
 *   (e.g. it's limited to a * x_1 + b * x_2 + ..., where [a,b] are coefficients and [x_1,x_2] are variables)
 * - larger than or equals, less than or equals, and equals constraints are all allowed ([<=,>=,=])
 */
export const calculateOptimalSolution = async (
  state: State,
  orderState: OrderState,
  weights: SolverWeights
): Promise<SolverResult> => {
  return require('glpk.js').then((glpk: any) => {
    const lp = {
      name: 'LP',
      objective: {
        // Maximize: dropRedeem > tinRedeem > tinInvest > dropInvest
        direction: glpk.GLP_MAX,
        name: 'obj',
        vars: [
          { name: 'dropRedeem', coef: weights.seniorRedeem },
          { name: 'tinRedeem', coef: weights.juniorRedeem },
          { name: 'tinInvest', coef: weights.juniorSupply },
          { name: 'dropInvest', coef: weights.seniorSupply },
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

    try {
      const output = glpk.solve(lp, glpk.GLP_MSG_ERR)
      return output.result
    } catch (e) {
      console.error(`Error caught during solver execution: ${e}`)

      return {
        z: 0,
        status: 0,
        vars: {},
        error: e,
      }
    }
  })
}

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

export interface SolverWeights {
  seniorRedeem: number
  juniorRedeem: number
  juniorSupply: number
  seniorSupply: number
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
  error?: string
}
