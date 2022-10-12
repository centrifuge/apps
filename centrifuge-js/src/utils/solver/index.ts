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

  const bounds = orders
    .map((order, index) => [
      `0 <= tranche-${index}-invest  <= ${order.invest}\n`,
      `0 <= tranche-${index}-redeem  <= ${order.redeem}\n`,
    ])
    .flat()
    .join()
    .replaceAll(',', '')

  // senior first
  // const reversedTranches = state.tranches.reverse()
  // const trancheA = state.tranches[1] // senior
  // const trancheB = state.tranches[0] // junior
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

  // minRatio formula with 4 tranches
  // minBRatioConstraint: maxARatio(Binv - Bred) + minBRatio(Ared - Ainv) >= minBRatioLb
  // minCRatioConstraint: maxBRatio(Cinv - Cred) + minCRatio(Ared - Ainv + Bred - Binv) >= minCRatioLb
  // minDRatioConstraint: maxCRatio(Dinv - Dred) + minDRatio(Ared - Ainv + Bred - Binv + Cred - Cinv) >= minDRatioLb
  const minRiskBufferConstraints = state.tranches
    .map((tranche, index) => {
      if (index === 0) {
        const minJun = new BN(0)
        const minSen = state.tranches[index + 1].minRiskBuffer!.div(e27) // mezz tranche
        // maxProtection = 1 - minRiskBuffer
        const maxSen = e27.sub(minSen).div(e27)
        const maxSeniorLb = minJun
          .mul(state.netAssetValue)
          .add(minJun.mul(state.reserve))
          .sub(state.tranches[index + 1].ratio.div(e27).mul(state.netAssetValue.add(state.reserve)))
        return `max${index}RiskBuffer: ${maxSen} tranche-0-invest - ${maxSen} tranche-0-redeem - ${minJun} tranche-1-invest + ${minJun} tranche-1-redeem >= ${maxSeniorLb}\n`
      }
      const maxJuniorRiskBuffer = index === 1 ? new BN(1) : e27.sub(state.tranches[index - 1].minRiskBuffer!) // e.g 92%
      const minSeniorRiskBuffer = new BN(tranche.minRiskBuffer!)

      const varsMin = [
        minSeniorRiskBuffer.neg(),
        minSeniorRiskBuffer,
        ...[Array(index).fill([maxJuniorRiskBuffer, maxJuniorRiskBuffer.neg()]).flat()].flat(),
      ]
      const riskBufferVarNames = [...varNames.slice(0, 2 * (index + 1))]
      const tranchesValues = state.tranches.slice(0, index).reduce((prev, curr) => {
        return prev.add(curr.ratio.div(e27).mul(state.netAssetValue.add(state.reserve)))
      }, new BN(0))

      // minSeniorRatioLb always refers to the tranche that is next in senority
      const minSeniorRatioLb = maxJuniorRiskBuffer
        .neg()
        .mul(state.netAssetValue)
        .sub(maxJuniorRiskBuffer.mul(state.reserve))
        .add(tranchesValues)

      return `min${index}RiskBuffer: ${linearExpression(riskBufferVarNames, varsMin)} >= ${minSeniorRatioLb}\n`
    })
    .flat()
    .join()
    .replaceAll(',', '')

  // minCRatioConstraint: maxBRatio(Cinv - Cred) + minCRatio(Ared - Ainv + Bred - Binv) >= minCRatioLb
  const lp = `
    Maximize
      ${linearExpression(varNames, varWeights)}
    Subject To
      reserve: ${linearExpression(varNames, reserveCoefs)} >= ${state.reserve.neg()}
      maxReserve: ${linearExpression(varNames, reserveCoefs)} <= ${state.maxReserve.sub(state.reserve)}
      ${minRiskBufferConstraints}
    Bounds
      ${bounds}
    End
      `

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
