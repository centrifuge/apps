import assert from 'assert'
import BN from 'bn.js'
import fs from 'fs'
import glob from 'glob'
import { CurrencyBalance } from '../BN'
import { calculateOptimalSolution, State, TrancheState } from './index'

const DebugMode: boolean = false

const objToNum = (jsonNumber: { base: number; value: number; add?: number } | string) => {
  if (typeof jsonNumber == 'string') return new CurrencyBalance(jsonNumber, 18)
  const add = jsonNumber.add ? jsonNumber.add : 0

  return new CurrencyBalance(CurrencyBalance.fromFloat(jsonNumber.value, jsonNumber.base).addn(add), jsonNumber.base)
}

const problems = glob.sync('src/utils/solver/problems/*.json')
describe('pocc-solver tests', () => {
  problems.forEach((problemPath: string) => {
    const problem = JSON.parse(fs.readFileSync(problemPath, 'utf8'))
    const name = problemPath.split('/').slice(-1)[0].split('.').slice(0, -1).join('.')

    it(`Should solve the ${name} test case`, async () => {
      const state: State = {
        netAssetValue: objToNum(problem.state.netAssetValue),
        reserve: objToNum(problem.state.reserve),
        maxReserve: objToNum(problem.state.maxReserve),
        currencyDecimals: problem.state.currencyDecimals,
        tranches: problem.state.tranches.map((tranche: any) => {
          return {
            ratio: objToNum(tranche.ratio),
            minRiskBuffer: tranche.minRiskBuffer ? objToNum(tranche.minRiskBuffer) : null,
          }
        }) as TrancheState[],
      }

      const orders = problem.orders.map((tranche: any) => {
        return {
          invest: objToNum(tranche.invest),
          redeem: objToNum(tranche.redeem),
        }
      })

      const expectedSolution = problem.solution.map((tranche: any) => {
        return {
          invest: {
            amount: objToNum(tranche.invest.amount),
            perquintill: objToNum(tranche.invest.perquintill),
          },
          redeem: {
            amount: objToNum(tranche.redeem.amount),
            perquintill: objToNum(tranche.redeem.perquintill),
          },
        }
      })

      const expected = {
        tranches: expectedSolution,
        isFeasible: 'isFeasible' in problem.solution ? problem.solution.isFeasible : true,
      }

      const redeemStartWeight = new BN(10).pow(new BN(problem.state.tranches.length))
      const weights = problem.state.tranches.map((_t: any, index: number) => {
        return {
          invest: new BN(10).pow(new BN(problem.state.tranches.length - index)),
          redeem: redeemStartWeight.mul(new BN(10).pow(new BN(index).add(new BN(1)))),
        }
      })

      const result = await calculateOptimalSolution(state, orders, weights)

      // Log inputs and outputs if one of the asserts fails
      if (
        DebugMode ||
        result.isFeasible !== expected.isFeasible ||
        result.tranches.every((result, index) => {
          const { invest: investResult, redeem: redeemResult } = result
          return (
            investResult.amount !== expected.tranches[index].invest.amount ||
            redeemResult.amount !== expected.tranches[index].redeem.amount
          )
        })
      ) {
        if (problem.explanation) console.log(`${problem.explanation}\n`)
        console.log(`\n\t- State`)
        Object.keys(state).forEach((key: string) => {
          console.log(`\t${key}: ${(state as any)[key].toString()}`)
        })
        console.log(`\n\t- Orders`)
        Object.keys(orders).forEach((key: string) => {
          console.log(`\t${key}: ${orders[key].toString()}`)
        })
        console.log(`\n\t- Expected output`)
        Object.keys(expected).forEach((key: string) => {
          console.log(`\t${key}: ${(expected as any)[key].toString()}`)
        })
        console.log(`\n\t- Actual output`)
        Object.keys(result).forEach((key: string) => {
          console.log(`\t${key}: ${(result as any)[key].toString()}`)
        })
        console.log()
      }

      assert.strictEqual(result.isFeasible, expected.isFeasible, 'isFeasible does not match')
      result.tranches.forEach((result, index) => {
        const { invest: investResult, redeem: redeemResult } = result
        assert.strictEqual(
          investResult.amount.toString(),
          expected.tranches[index].invest.amount.toString(),
          `tranche-${index}-invest amount is not correct`
        )
        assert.strictEqual(
          investResult.perquintill.toString(),
          expected.tranches[index].invest.perquintill.toString(),
          `tranche-${index}-invest perquintill is not correct`
        )
        assert.strictEqual(
          redeemResult.amount.toString(),
          expected.tranches[index].redeem.amount.toString(),
          `tranche-${index}-redeem amount is not correct`
        )
        assert.strictEqual(
          redeemResult.perquintill.toString(),
          expected.tranches[index].redeem.perquintill.toString(),
          `tranche-${index}-redeem perquintill is not correct`
        )
      })
    })
  })
})
