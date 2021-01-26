import BN from 'bn.js'
import { CLP } from 'clp-wasm'

export const calculateOptimalSolution = async (
  state: State,
  orders: Orders,
  weights: SolverWeights
): Promise<SolverResult> => {
  return require('clp-wasm/clp-wasm.all').then((clp: CLP) => {
    const e27 = new BN(1).mul(new BN(10).pow(new BN(27)))
    const maxTinRatio = e27.sub(state.minDropRatio)
    const minTinRatio = e27.sub(state.maxDropRatio)

    const minTINRatioLb = state.maxDropRatio
      .neg()
      .mul(state.netAssetValue)
      .sub(state.maxDropRatio.mul(state.reserve))
      .add(state.seniorAsset.mul(e27))

    const maxTINRatioLb = state.minDropRatio
      .mul(state.netAssetValue)
      .add(state.minDropRatio.mul(state.reserve))
      .sub(state.seniorAsset.mul(e27))

    const varWeights = [
      parseFloat(weights.tinInvest.toString()),
      parseFloat(weights.dropInvest.toString()),
      parseFloat(weights.tinRedeem.toString()),
      parseFloat(weights.dropRedeem.toString()),
    ]
    const minTINRatioLbCoeffs = [state.maxDropRatio, minTinRatio.neg(), state.maxDropRatio.neg(), minTinRatio]
    const maxTINRatioLbCoeffs = [state.minDropRatio.neg(), maxTinRatio, state.minDropRatio, maxTinRatio.neg()]

    const lp = `
      Maximize
        ${linearExpression(varWeights)}
      Subject To
        reserve: ${linearExpression([1, 1, -1, -1])} >= ${state.reserve.neg()}
        maxReserve: ${linearExpression([1, 1, -1, -1])} <= ${state.maxReserve.sub(state.reserve)}
        minTINRatioLb: ${linearExpression(minTINRatioLbCoeffs)} >= ${minTINRatioLb}
        maxTINRatioLb: ${linearExpression(maxTINRatioLbCoeffs)} >= ${maxTINRatioLb}
      Bounds
        0 <= tinInvest  <= ${orders.tinInvest}
        0 <= dropInvest <= ${orders.dropInvest}
        0 <= tinRedeem  <= ${orders.tinRedeem}
        0 <= dropRedeem <= ${orders.dropRedeem}
      End
    `

    const output = clp.solve(lp, 0)

    const solutionVector = output.solution.map((x) => new BN(clp.bnRound(x)))
    const linearEval = (coefs: (BN | number)[], vars: (BN | number)[]) => {
      let res = new BN(0)
      if (vars.length != 4 || coefs.length != 4) throw new Error('Invalid sequences here')
      for (let i = 0; i < 4; i++) {
        res = res.add(new BN(vars[i]).mul(new BN(coefs[i])))
      }
      return res
    }
    const debugConstraints = `
    reserve: ${linearEval([1, 1, -1, -1], solutionVector)} >= ${state.reserve.neg()}
    maxReserve: ${linearEval([1, 1, -1, -1], solutionVector)} <= ${state.maxReserve.sub(state.reserve)}
    minTINRatioLb: ${linearEval(minTINRatioLbCoeffs, solutionVector)} >= ${minTINRatioLb}
    maxTINRatioLb: ${linearEval(maxTINRatioLbCoeffs, solutionVector)} >= ${maxTINRatioLb}`
    // console.log(debugConstraints)

    const isFeasible = output.infeasibilityRay.length == 0 && output.integerSolution
    if (!isFeasible) {
      // If it's not possible to go into a healthy state, calculate the best possible solution to break the constraints less
      const currentSeniorRatio = state.seniorAsset.mul(e27).div(state.netAssetValue.add(state.reserve))

      if (currentSeniorRatio.lte(state.minDropRatio)) {
        const dropInvest = orders.dropInvest
        const tinRedeem = BN.min(orders.tinRedeem, state.reserve.add(dropInvest))

        return {
          isFeasible: true,
          dropInvest,
          tinRedeem,
          tinInvest: new BN(0),
          dropRedeem: new BN(0),
        }
      } else if (currentSeniorRatio.gte(state.maxDropRatio)) {
        const tinInvest = orders.tinInvest
        const dropRedeem = BN.min(orders.dropRedeem, state.reserve.add(tinInvest))

        return {
          isFeasible: true,
          tinInvest,
          dropRedeem,
          dropInvest: new BN(0),
          tinRedeem: new BN(0),
        }
      } else if (state.reserve.gte(state.maxReserve)) {
        const dropRedeem = BN.min(orders.dropRedeem, state.reserve) // Limited either by the order or the reserve
        const tinRedeem = BN.min(orders.tinRedeem, state.reserve.sub(dropRedeem)) // Limited either by the order or what's remaining of the reserve after the DROP redemptions

        return {
          isFeasible: true,
          tinRedeem,
          dropRedeem,
          dropInvest: new BN(0),
          tinInvest: new BN(0),
        }
      } else {
        return {
          isFeasible: false,
          dropInvest: new BN(0),
          dropRedeem: new BN(0),
          tinInvest: new BN(0),
          tinRedeem: new BN(0),
        }
      }
    }

    return {
      isFeasible,
      dropInvest: solutionVector[1],
      dropRedeem: solutionVector[3],
      tinInvest: solutionVector[0],
      tinRedeem: solutionVector[2],
    }
  })
}

const nameValToStr = (name: string, coef: BN | number, first: boolean) => {
  const ONE = new BN(1)
  const ZERO = new BN(0)
  const coefBN = new BN(coef)
  if (coefBN.eq(ZERO)) {
    return ''
  }
  let str = ''
  if (first && coefBN.eq(ONE)) {
    return name
  }
  if (coefBN.eq(ONE)) {
    str += '+'
  } else if (coefBN.eq(ONE.neg())) {
    str += '-'
  } else {
    str += (coefBN.gt(ZERO) ? '+' : '') + coefBN.toString()
  }
  str += ` ${name}`
  return str
}

const linearExpression = (coefs: (BN | number)[]) => {
  const varNames = ['tinInvest', 'dropInvest', 'tinRedeem', 'dropRedeem']
  let str = ''
  let first = true
  const n = varNames.length
  for (let i = 0; i < n; i += 1) {
    str += `${nameValToStr(varNames[i], coefs[i], first)} `
    first = false
  }
  return str
}

export interface State {
  netAssetValue: BN
  reserve: BN
  seniorAsset: BN
  minDropRatio: BN
  maxDropRatio: BN
  maxReserve: BN
}

export interface Orders {
  tinRedeem: BN
  dropRedeem: BN
  tinInvest: BN
  dropInvest: BN
}

export interface SolverWeights {
  dropRedeem: BN
  tinRedeem: BN
  tinInvest: BN
  dropInvest: BN
}

export interface SolverSolution {
  tinRedeem: BN
  dropRedeem: BN
  tinInvest: BN
  dropInvest: BN
}

export interface SolverResult {
  isFeasible: boolean
  tinRedeem: BN
  dropRedeem: BN
  tinInvest: BN
  dropInvest: BN
  error?: string
}
