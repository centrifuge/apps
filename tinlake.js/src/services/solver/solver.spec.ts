import assert from 'assert'
import BN from 'bn.js'
import { calculateOptimalSolution } from './solver'
import glob from 'glob'
import fs from 'fs'

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
describe('solver dynamic tests', () => {
  problems.forEach((problemPath: string) => {
    const problem = JSON.parse(fs.readFileSync(problemPath, 'utf8'))

    it(`Should solve the ${problemPath} test case`, async () => {
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

      const result = await calculateOptimalSolution(state, orders, weights)

      // Log inputs and outputs if one of the asserts fails
      if (
        result.vars.dropInvest.toString() !== objToNum(problem.orders.dropInvest).toString() ||
        result.vars.dropRedeem.toString() !== objToNum(problem.orders.dropRedeem).toString() ||
        result.vars.tinInvest.toString() !== objToNum(problem.orders.tinInvest).toString() ||
        result.vars.tinRedeem.toString() !== objToNum(problem.orders.tinRedeem).toString()
      ) {
        console.log(`\n\t- Input: State`)
        Object.keys(state).forEach((key: string) => {
          console.log(`\t${key}: ${state[key].toString()}`)
        })
        console.log(`\n\t- Input: Orders`)
        Object.keys(orders).forEach((key: string) => {
          console.log(`\t${key}: ${orders[key].toString()}`)
        })
        console.log(`\n\t- Output`)
        Object.keys(result.vars).forEach((key: string) => {
          console.log(`\t${key}: ${result.vars[key].toString()}`)
        })
        console.log()
      }

      assert.strictEqual(
        result.vars.dropInvest.toString(),
        objToNum(problem.orders.dropInvest).toString(),
        'dropInvest is not correct'
      )
      assert.strictEqual(
        result.vars.dropRedeem.toString(),
        objToNum(problem.orders.dropRedeem).toString(),
        'dropRedeem is not correct'
      )
      assert.strictEqual(
        result.vars.tinInvest.toString(),
        objToNum(problem.orders.tinInvest).toString(),
        'tinInvest is not correct'
      )
      assert.strictEqual(
        result.vars.tinRedeem.toString(),
        objToNum(problem.orders.tinRedeem).toString(),
        'tinRedeem is not correct'
      )
    })
  })
})
