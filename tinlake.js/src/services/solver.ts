import BN from 'bn.js'
// import { CLP } from 'clp-wasm'

export const calculateOptimalSolution = async (
  state: State,
  orders: OrderState,
  weights: SolverWeights
): Promise<any> => {
  return require('clp-wasm/clp-wasm').then((clp: any) => {
    const e27 = new BN(1).mul(new BN(10).pow(new BN(27)))
    const maxDropRatio = e27.sub(state.minTinRatio)
    const minDropRatio = e27.sub(state.maxTinRatio)

    const minTINRatioLb = maxDropRatio
      .neg()
      .mul(state.netAssetValue)
      .sub(maxDropRatio.mul(state.reserve))
      .add(state.seniorAsset.mul(e27))

    const maxTINRatioLb = minDropRatio
      .mul(state.netAssetValue)
      .add(minDropRatio.mul(state.reserve))
      .sub(state.seniorAsset.mul(e27))

    const varWeights = [weights.juniorSupply, weights.seniorSupply, weights.juniorRedeem, weights.seniorRedeem]
    const minTINRatioLbCoeffs = [maxDropRatio, state.minTinRatio.neg(), maxDropRatio.neg(), state.minTinRatio]
    const maxTINRatioLbCoeffs = [minDropRatio.neg(), state.maxTinRatio, minDropRatio, state.maxTinRatio.neg()]

    const lp = `
      Maximize
      ${linearExpression(varWeights)}
      Subject To
      reserve: ${linearExpression([1, 1, -1, -1])} <= ${state.reserve}
      maxReserve: ${linearExpression([1, 1, -1, -1])} >= ${state.reserve.sub(state.maxReserve)}
      minTINRatioLb: ${linearExpression(minTINRatioLbCoeffs)} >= ${minTINRatioLb}
      maxTINRatioLb: ${linearExpression(maxTINRatioLbCoeffs)} >= ${maxTINRatioLb}
      Bounds
      0 <= tinInvest  <= ${orders.tinInvestOrder}
      0 <= dropInvest <= ${orders.dropInvestOrder}
      0 <= tinRedeem  <= ${orders.tinRedeemOrder}
      0 <= dropRedeem <= ${orders.dropRedeemOrder}
      End
    `

    const output = clp.solve(lp)
    console.log({ output })

    const outputToBN = (str: string) => new BN(str.split('.')[0])

    const isFeasible = output.infeasibilityRay
      .map((ray: string) => outputToBN(ray.split('.')[0]))
      .every((ray: BN) => ray.isZero())

    const vars = {
      tinRedeem: outputToBN(output.solution[2]),
      dropRedeem: outputToBN(output.solution[3]),
      tinInvest: outputToBN(output.solution[0]),
      dropInvest: outputToBN(output.solution[1]),
    }

    return { isFeasible, vars }
  })
}

const nameValToStr = (name: string, coef: BN | number, first: boolean) => {
  const coefNum = typeof coef !== 'number' ? coef : parseFloat(coef.toString())
  let str = ''
  if (first && coefNum == 1) return name
  if (coefNum === 1) {
    str += '+'
  } else if (coefNum == -1) {
    str += '-'
  } else {
    str += coefNum
  }
  str += ' ' + name
  return str
}

const linearExpression = (coefs: (BN | number)[]) => {
  const varNames = ['tinInvest', 'dropInvest', 'tinRedeem', 'dropRedeem']
  let str = ''
  let first = true
  const n = varNames.length
  for (let i = 0; i < n; ++i) {
    str += nameValToStr(varNames[i], coefs[i], first) + ' '
    first = false
  }
  return str
}

export interface State {
  netAssetValue: BN
  reserve: BN
  seniorAsset: BN
  minTinRatio: BN
  maxTinRatio: BN
  maxReserve: BN
}

export interface OrderState {
  tinRedeemOrder: BN
  dropRedeemOrder: BN
  tinInvestOrder: BN
  dropInvestOrder: BN
}

export interface SolverWeights {
  seniorRedeem: BN
  juniorRedeem: BN
  juniorSupply: BN
  seniorSupply: BN
}

export interface SolverSolution {
  tinRedeem: BN
  dropRedeem: BN
  tinInvest: BN
  dropInvest: BN
}

export interface SolverResult {
  isFeasible: boolean
  vars: SolverSolution
  error?: string
}
