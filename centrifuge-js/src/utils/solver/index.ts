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
  // const trancheB = reversedTranches[1]
  // const trancheC = reversedTranches[2]

  // 2 tranche model
  const minA = trancheA.minRiskBuffer!.div(e27) // 8%
  const maxA = e27.sub(minA).div(e27) // 92%
  const minB = new BN(0) // junior tranche
  const maxB = e27.div(e27) // junior tranche

  const maxBLb = minA
    .mul(state.netAssetValue)
    .add(minA.mul(state.reserve))
    .sub(trancheA.ratio.div(e27).mul(state.netAssetValue.add(state.reserve)))

  const minBLb = maxA
    .neg()
    .mul(state.netAssetValue)
    .sub(maxA.mul(state.reserve))
    .sub(trancheA.ratio.div(e27).mul(state.netAssetValue.add(state.reserve)))

  const coefs = Array(state.tranches.length).fill([1, -1]).flat()

  // 2 tranche
  const lp = `
      Maximize
        ${linearExpression(varNames, varWeights)}
      Subject To
        reserve: ${linearExpression(varNames, coefs)} >= ${state.reserve.neg()}
        maxReserve: ${linearExpression(varNames, coefs)} <= ${state.maxReserve.sub(state.reserve)}
        maxB: ${maxB} tranche-0-invest - ${maxB} tranche-0-redeem + ${minA} tranche-1-redeem - ${minA} tranche-1-invest >= ${maxBLb}
        minB: ${maxA} tranche-1-invest - ${maxA} tranche-1-redeem + ${minB} tranche-0-redeem - ${minB} tranche-0-invest >= ${minBLb}
      Bounds
        ${bounds}
      End
    `
  // minCRatioConstraint: maxBRatio(Cinv - Cred) + minCRatio(Ared - Ainv + Bred - Binv) >= minCRatioLb
  // minCRatioConstraint: maxB*Cinv - maxB*Cred + minC*Ared - minC*Ainv + minC*Bred - minC*Binv

  // 3 tranche model
  // const minA = trancheA.minRiskBuffer! // 8%
  // const maxA = e27.sub(minA) // 92%
  // const minB = trancheB.minRiskBuffer! // mezz tranche
  // const maxB = e27.sub(minB) // mezz tranche
  // const minC = 0 // in 3 tranche model this is the junior tranche
  // const maxC = e27 // in 3 tranche model this is the junior tranche

  // const maxABRatio = maxA.add(maxB)
  // const minCLb = maxABRatio
  //   .neg()
  //   .mul(state.netAssetValue)
  //   .sub(maxABRatio.mul(state.reserve))
  //   .sub(trancheA.ratio.mul(state.netAssetValue.add(state.reserve)))
  //   .sub(trancheB.ratio.mul(state.netAssetValue.add(state.reserve)))
  //
  // const lp = `
  //   Maximize
  //     ${linearExpression(varNames, varWeights)}
  //   Subject To
  //     reserve: ${linearExpression(varNames, coefs)} >= ${state.reserve.neg()}
  //     maxReserve: ${linearExpression(varNames, coefs)} <= ${state.maxReserve.sub(state.reserve)}
  //     minB: ${maxA} tranche-1-invest - ${maxA} tranche-1-redeem + ${minB} tranche-0-redeem - ${minB} tranche-0-invest >= ${minBLb}
  //     maxC: ${maxB} tranche-0-invest - ${maxB} tranche-0-redeem + ${minA} tranche-1-redeem - ${minA} tranche-1-invest >= ${maxBLb}
  //     minC: ${maxB} tranche-2-invest - ${maxB} tranche-2-redeem + ${minC} tranche-0-redeem - ${minC} tranche-0-invest + ${minC} tranche-1-redeem - ${minC} tranche-1-invest  >= ${minCLb}
  //   Bounds
  //     ${bounds}
  //   End
  // `

  // `0 = A = senior = DROP`
  // `1 = B = junior = TIN`

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
