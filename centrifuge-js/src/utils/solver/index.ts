import BN from 'bn.js'
import { CLP } from 'clp-wasm'
import { CurrencyBalance, Perquintill } from '../BN'

export const calculateOptimalSolution = async (
  state: State,
  orders: TrancheOrders[],
  weights: TrancheWeights[],
  calcInvestmentCapacityForTranche?: number
): Promise<SolverResult> => {
  // @ts-expect-error
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

  // const e27 = new BN(1).mul(new BN(10).pow(new BN(27)))

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

  const coefs = Array(state.tranches.length).fill([1, -1]).flat()

  // TODO: add ${minRiskBufferConstraints}
  const lp = `
      Maximize
        ${linearExpression(varNames, varWeights)}
      Subject To
        reserve: ${linearExpression(varNames, coefs)} >= ${state.reserve.neg()}
        maxReserve: ${linearExpression(varNames, coefs)} <= ${state.maxReserve.sub(state.reserve)}
      Bounds
        ${bounds}
      End
    `

  // console.log(lp)

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
