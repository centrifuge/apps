import assert from 'assert'
import BN from 'bn.js'
import fs from 'fs'
import glob from 'glob'
import { calculateOptimalSolution } from './solver'

const DebugMode: boolean = false

const e27 = new BN(1).mul(new BN(10).pow(new BN(27)))

const objToNum = (jsonNumber: { base: number; value: number; add?: number } | string) => {
  if (typeof jsonNumber == 'string') return new BN(jsonNumber)
  const add = jsonNumber.add ? jsonNumber.add : 0
  return new BN(jsonNumber.value * 100000).mul(new BN(10).pow(new BN(jsonNumber.base - 5))).add(new BN(add))
}

const problems = glob.sync('src/services/pocc-solver/problems/*.json')
describe('pocc-solver tests', () => {
  problems.forEach((problemPath: string) => {
    const problem = JSON.parse(fs.readFileSync(problemPath, 'utf8'))
    const name = problemPath.split('/').slice(-1)[0].split('.').slice(0, -1).join('.')

    it(`Should solve the ${name} test case`, async () => {
      const state = {
        netAssetValue: objToNum(problem.state.netAssetValue),
        reserve: objToNum(problem.state.reserve),
        maxReserve: objToNum(problem.state.maxReserve),
        tranches: problem.state.tranches.map((tranche) => {
          return {
            ratio: objToNum(tranche.ratio),
            minRiskBuffer: tranche.minRiskBuffer ? objToNum(tranche.minRiskBuffer) : undefined,
          }
        }),
      }

      const orders = problem.orders.map((tranche) => {
        return {
          invest: objToNum(tranche.invest),
          redeem: objToNum(tranche.redeem),
        }
      })

      const expectedSolution = problem.solution.map((tranche) => {
        return {
          invest: objToNum(tranche.invest),
          redeem: objToNum(tranche.redeem),
        }
      })

      const expected = {
        tranches: expectedSolution,
        isFeasible: 'isFeasible' in problem.solution ? problem.solution.isFeasible : true,
      }

      const redeemStartWeight = new BN(10).pow(new BN(problem.state.tranches.length))
      const weights = problem.state.tranches.map((_t, index) => {
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
        result.tranches.every(
          (result, index) =>
            result.invest !== expected.tranches[index].invest || result.redeem !== expected.tranches[index].redeem
        )
      ) {
        if (problem.explanation) console.log(`${problem.explanation}\n`)
        console.log(`\n\t- State`)
        Object.keys(state).forEach((key: string) => {
          console.log(`\t${key}: ${state[key].toString()}`)
        })
        console.log(`\n\t- Orders`)
        Object.keys(orders).forEach((key: string) => {
          console.log(`\t${key}: ${orders[key].toString()}`)
        })
        console.log(`\n\t- Expected output`)
        Object.keys(expected).forEach((key: string) => {
          console.log(`\t${key}: ${expected[key].toString()}`)
        })
        console.log(`\n\t- Actual output`)
        Object.keys(result).forEach((key: string) => {
          console.log(`\t${key}: ${result[key].toString()}`)
        })
        console.log()
      }

      assert.strictEqual(result.isFeasible, expected.isFeasible, 'isFeasible does not match')
      result.tranches.forEach((result, index) => {
        assert.strictEqual(
          result.invest.toString(),
          expected.tranches[index].invest.toString(),
          `tranche-${index}-invest is not correct`
        )
        assert.strictEqual(
          result.redeem.toString(),
          expected.tranches[index].redeem.toString(),
          `tranche-${index}-redeem is not correct`
        )
      })
    })
  })
})
