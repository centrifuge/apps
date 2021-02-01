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

const weights = {
  dropRedeem: new BN(1000000),
  tinRedeem: new BN(100000),
  tinInvest: new BN(10000),
  dropInvest: new BN(1000),
}

const problems = glob.sync('src/services/solver/problems/*.json')
describe('solver tests', () => {
  problems.forEach((problemPath: string) => {
    const problem = JSON.parse(fs.readFileSync(problemPath, 'utf8'))
    const name = problemPath.split('/').slice(-1)[0].split('.').slice(0, -1).join('.')

    it(`Should solve the ${name} test case`, async () => {
      const state = {
        netAssetValue: objToNum(problem.state.netAssetValue),
        reserve: objToNum(problem.state.reserve),
        seniorAsset: objToNum(problem.state.seniorAsset),
        minDropRatio: e27.sub(objToNum(problem.state.maxTinRatio)),
        maxDropRatio: e27.sub(objToNum(problem.state.minTinRatio)),
        maxReserve: objToNum(problem.state.maxReserve),
      }

      const orders = {
        dropInvest: objToNum(problem.orders.dropInvest),
        dropRedeem: objToNum(problem.orders.dropRedeem),
        tinInvest: objToNum(problem.orders.tinInvest),
        tinRedeem: objToNum(problem.orders.tinRedeem),
      }

      const expected = {
        dropInvest: problem.solution.dropInvest ? objToNum(problem.solution.dropInvest) : new BN(0),
        dropRedeem: problem.solution.dropRedeem ? objToNum(problem.solution.dropRedeem) : new BN(0),
        tinInvest: problem.solution.tinInvest ? objToNum(problem.solution.tinInvest) : new BN(0),
        tinRedeem: problem.solution.tinRedeem ? objToNum(problem.solution.tinRedeem) : new BN(0),
        isFeasible: 'isFeasible' in problem.solution ? problem.solution.isFeasible : true,
      }

      const result = await calculateOptimalSolution(state, orders, weights)

      // Log inputs and outputs if one of the asserts fails
      if (
        DebugMode ||
        result.isFeasible !== expected.isFeasible ||
        result.dropInvest.toString() !== expected.dropInvest.toString() ||
        result.dropRedeem.toString() !== expected.dropRedeem.toString() ||
        result.tinInvest.toString() !== expected.tinInvest.toString() ||
        result.tinRedeem.toString() !== expected.tinRedeem.toString()
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
      assert.strictEqual(result.dropInvest.toString(), expected.dropInvest.toString(), 'dropInvest is not correct')
      assert.strictEqual(result.dropRedeem.toString(), expected.dropRedeem.toString(), 'dropRedeem is not correct')
      assert.strictEqual(result.tinInvest.toString(), expected.tinInvest.toString(), 'tinInvest is not correct')
      assert.strictEqual(result.tinRedeem.toString(), expected.tinRedeem.toString(), 'tinRedeem is not correct')
    })
  })
})
