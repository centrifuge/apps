import BN from 'bn.js'
import { CLP } from 'clp-wasm'
import { CurrencyBalance, Perquintill } from '../BN'

export const calculateOptimalSolution = async (
  state: State,
  orders: TrancheOrders[],
  weights: TrancheWeights[],
  calcInvestmentCapacityForTranche?: number
): Promise<SolverResult> => {
  const res = await import('clp-wasm/clp-wasm.all')
  const clp: CLP = await res.default
  if (state.tranches.length !== orders.length || orders.length !== weights.length) {
    throw new Error('Mismatched input length')
  }

  if (state.tranches.length === 0 || state.tranches[0].minRiskBuffer !== null) {
    throw new Error('Missing junior tranche')
  }

  if (!state.tranches.slice(1).every((tranche) => !!tranche.minRiskBuffer)) {
    throw new Error('Missing min risk buffer for non junior tranche')
  }

  if (!state.tranches.every((tranche) => !!tranche.ratio)) {
    throw new Error('Missing ratio for tranche')
  }

  if (calcInvestmentCapacityForTranche !== undefined && state.tranches.length < calcInvestmentCapacityForTranche) {
    throw new Error('Trying to calculate investment capacity for an invalid tranche')
  }

  const e27 = new BN(1).mul(new BN(10).pow(new BN(27)))

  const varWeights = weights
    .map((tranche) => [parseFloat(tranche.invest.toString()), parseFloat(tranche.redeem.toString())])
    .flat()

  const varNames = weights.map((_t, index) => [`tranche-${index}-invest`, `tranche-${index}-redeem`]).flat()
  const reserveCoefs = Array(state.tranches.length).fill([1, -1]).flat()

  // const minRiskBufferConstraints = state.tranches
  //   .slice(1) // skip junior tranche
  //   .map(
  //     (tranche, index) => `
  //       tranche-${index}-minRiskBuffer: ${linearExpression(varNames, [1, -1, 1, -1])} <= ${tranche.minRiskBuffer}
  //     `
  //   )
  //   .join()

  const bounds = orders
    .map((order, index) => [
      `0 <= tranche-${index}-invest  <= ${order.invest}\n`,
      `0 <= tranche-${index}-redeem  <= ${order.redeem}\n`,
    ])
    .flat()
    .join()
    .replaceAll(',', '')

  // senior first
  const reversedTranches = state.tranches.reverse()
  const trancheA = reversedTranches[0]
  const trancheB = reversedTranches[1]
  // const trancheC = reversedTranches[2]

  // 2 tranche model
  // const minA = trancheA.minRiskBuffer!.div(e27) // 8%
  // const maxA = e27.sub(minA).div(e27) // 92%
  // const minB = new BN(0) // junior tranche
  // const maxB = e27.div(e27) // junior tranche

  // const maxBLb = minA
  //   .mul(state.netAssetValue)
  //   .add(minA.mul(state.reserve))
  //   .sub(trancheA.ratio.div(e27).mul(state.netAssetValue.add(state.reserve)))

  // const minBLb = maxA
  //   .neg()
  //   .mul(state.netAssetValue)
  //   .sub(maxA.mul(state.reserve))
  //   .sub(trancheA.ratio.div(e27).mul(state.netAssetValue.add(state.reserve)))

  // const coefs = Array(state.tranches.length).fill([1, -1]).flat()
  // const lp = `
  //     Maximize
  //       ${linearExpression(varNames, varWeights)}
  //     Subject To
  //       reserve: ${linearExpression(varNames, coefs)} >= ${state.reserve.neg()}
  //       maxReserve: ${linearExpression(varNames, coefs)} <= ${state.maxReserve.sub(state.reserve)}
  //       maxB1: ${maxB} tranche-0-invest - ${maxB} tranche-0-redeem + ${minA} tranche-1-redeem - ${minA} tranche-1-invest >= ${maxBLb}
  //       minB1: ${maxA} tranche-1-invest - ${maxA} tranche-1-redeem + ${minB} tranche-0-redeem - ${minB} tranche-0-invest >= ${minBLb}
  //     Bounds
  //       ${bounds}
  //     End
  //   `
  // minCRatioConstraint: maxBRatio(Cinv - Cred) + minCRatio(Ared - Ainv + Bred - Binv) >= minCRatioLb
  // minCRatioConstraint: maxB*Cinv - maxB*Cred + minC*Ared - minC*Ainv + minC*Bred - minC*Binv

  // 3 tranche model
  const min0 = trancheA.minRiskBuffer! // 8%
  const max0 = e27.sub(min0) // 92%
  const min1 = trancheB.minRiskBuffer! // mezz tranche
  const max1 = e27.sub(min1) // mezz tranche
  const min2 = new BN(0) // in 3 tranche model this is the junior tranche
  // const max2 = e27.div(e27) // in 3 tranche model this is the junior tranche

  const max1Lb = min0
    .mul(state.netAssetValue)
    .add(min0.mul(state.reserve))
    .sub(trancheA.ratio.div(e27).mul(state.netAssetValue.add(state.reserve)))

  const smt = state.tranches.map((tranche, index) => {
    if (index === 0) return ``
    const max0 = index > 0 ? e27.sub(state.tranches[index - 1].minRiskBuffer!) : new BN(1) // 92%
    const min1 = new BN(tranche.minRiskBuffer!) // mezz tranche

    const varsMin1 = [min1.neg(), min1, ...[Array(index).fill([max0, max0.neg()])].flat()].flat() // max0, max0.neg()
    console.log('🚀 ~ varsMin1', varsMin1)
    const riskBufferVarNames = [...varNames.slice(0, 2 * (index + 1))]
    console.log('🚀 ~ riskBufferVarNames', riskBufferVarNames)

    // something here is causing an infinite loops when running tests, start here!!!!
    const min1Lb = max0
      .neg()
      .mul(state.netAssetValue)
      .sub(max0.mul(state.reserve))
      .sub(state.tranches[index - 1].ratio.div(e27).mul(state.netAssetValue.add(state.reserve)))
    console.log('🚀 ~ min1Lb', min1Lb)

    return `min-${index + 1}-risk-buffer: ${linearExpression(riskBufferVarNames, varsMin1)} >= ${min1Lb}`
  })
  console.log('🚀 ~ smt', smt)

  // const varsMax1 = [max1, max1.neg(), min0.neg(), min0]
  // const varsMin1 = [min1.neg(), min1, max0, max0.neg()]
  // const varsMin2 = [min2.neg(), min2, min2.neg(), min2, max1, max1.neg()]

  const max01Ratio = max0.add(max1)
  const min2Lb = max01Ratio
    .neg()
    .mul(state.netAssetValue)
    .sub(max01Ratio.mul(state.reserve))
    .sub(trancheA.ratio.div(e27).mul(state.netAssetValue.add(state.reserve)))
    .sub(trancheB.ratio.div(e27).mul(state.netAssetValue.add(state.reserve)))

  // minCRatioConstraint: maxBRatio(Cinv - Cred) + minCRatio(Ared - Ainv + Bred - Binv) >= minCRatioLb
  const lp = `
    Maximize
      ${linearExpression(varNames, varWeights)}
    Subject To
      reserve: ${linearExpression(varNames, reserveCoefs)} >= ${state.reserve.neg()}
      maxReserve: ${linearExpression(varNames, reserveCoefs)} <= ${state.maxReserve.sub(state.reserve)}
      max1: ${max1} tranche-0-invest - ${max1} tranche-0-redeem - ${min0} tranche-1-invest + ${min0} tranche-1-redeem >= ${max1Lb}
      min2:-${min2} tranche-0-invest + ${min2} tranche-0-redeem - ${min2} tranche-1-invest + ${min2} tranche-1-redeem + ${max1} tranche-2-invest - ${max1} tranche-2-redeem  >= ${min2Lb}
      Bounds
      ${bounds}
      End
      `
  // min1:-${min1} tranche-0-invest + ${min1} tranche-0-redeem + ${max0} tranche-1-invest - ${max0} tranche-1-redeem >= ${min1Lb}

  // minMezz s
  // minJunior
  // maxJunior

  console.log(lp)

  const output = clp.solve(lp, 0)

  const solutionVector = output.solution.map((x: string) => new BN(clp.bnRound(x)))
  // TODO: check if output.integerSolution is necessary for feasibility
  const isFeasible = output.infeasibilityRay.length === 0

  if (!isFeasible) {
    return {
      isFeasible: false,
      tranches: state.tranches.map(() => {
        return {
          invest: {
            perquintill: Perquintill.fromFloat(0),
            amount: CurrencyBalance.fromFloat(0, state.currencyDecimals),
          },
          redeem: {
            perquintill: Perquintill.fromFloat(0),
            amount: CurrencyBalance.fromFloat(0, state.currencyDecimals),
          },
        }
      }),
    }
  }

  return {
    isFeasible,
    tranches: state.tranches.map((_t, index: number) => {
      const investSolution = new CurrencyBalance(solutionVector[index * 2].toString(), state.currencyDecimals)
      const redeemSolution = new CurrencyBalance(solutionVector[index * 2 + 1].toString(), state.currencyDecimals)
      const investPerquintill = Perquintill.fromFloat(
        investSolution.gtn(0) ? investSolution.toDecimal().div(orders[index].invest.toDecimal()).toString() : 0
      )
      const redeemPerquintill = Perquintill.fromFloat(
        redeemSolution.gtn(0) ? redeemSolution.toDecimal().div(orders[index].redeem.toDecimal()).toString() : 0
      )
      return {
        invest: {
          perquintill: investPerquintill,
          amount: investSolution,
        },
        redeem: {
          perquintill: redeemPerquintill,
          amount: redeemSolution,
        },
      }
    }),
  }
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

const linearExpression = (varNames: string[], coefs: (BN | number)[]) => {
  console.log('🚀 ~ linExpr varNames', varNames)
  let str = ''
  let first = true
  for (let i = 0; i < varNames.length; i += 1) {
    str += `${nameValToStr(varNames[i], coefs[i], first)} `
    first = false
  }
  return str
}

export interface TrancheState {
  ratio: Perquintill
  minRiskBuffer: Perquintill | null
}

export interface State {
  netAssetValue: CurrencyBalance
  reserve: CurrencyBalance
  tranches: TrancheState[]
  maxReserve: CurrencyBalance
  currencyDecimals: number
}

interface TrancheOrders {
  invest: CurrencyBalance
  redeem: CurrencyBalance
}

interface TrancheWeights {
  invest: BN
  redeem: BN
}

export type TrancheResult = {
  invest: {
    perquintill: Perquintill
    amount: CurrencyBalance
  }
  redeem: {
    perquintill: Perquintill
    amount: CurrencyBalance
  }
}

export interface SolverResult {
  isFeasible: boolean
  tranches: TrancheResult[]
  error?: string
}
