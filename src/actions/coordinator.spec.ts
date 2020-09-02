import assert from 'assert'
import { ITinlake } from '../types/tinlake'
import { createTinlake } from '../test/utils'
import testConfig from '../test/config'

let tinlake: ITinlake

describe('coordinator tests', async () => {
  before(async () => {
    tinlake = createTinlake(testConfig.godAccount, testConfig)
  })

  describe('epoch solver', async () => {
    it('should return an optimal solution when limited by the max TIN ratio', async () => {
      const state = {
        netAssetValue: 800,
        reserve: 200,
        seniorDebt: 700,
        seniorBalance: 100,
        minTinRatio: 0.15,
        maxTinRatio: 0.2,
        maxReserve: 10000,
      }

      const orderState = {
        tinRedeemOrder: 100,
        dropRedeemOrder: 300,
        tinInvestOrder: 200,
        dropInvestOrder: 400,
      }

      const result = await tinlake.calculateOptimalSolution(state, orderState)

      assert.equal(result.status, 5)
      assert.equal(result.z > 0, true)
      assert.equal(result.vars.tinRedeem, 100)
      assert.equal(result.vars.dropRedeem, 300)
      assert.equal(result.vars.tinInvest, 125)
      assert.equal(result.vars.dropInvest, 400)
    })

    it('should return an optimal solution when limited by the max reserve', async () => {
      // The gap between the maxReserve and reserve is 300, so 300 tokens can be invested.
      const state = {
        netAssetValue: 800,
        reserve: 200,
        seniorDebt: 700,
        seniorBalance: 100,
        minTinRatio: 0.0,
        maxTinRatio: 1.0,
        maxReserve: 500,
      }

      // 50 is redeemed, so 300+50=350 can be invested.
      const orderState = {
        tinRedeemOrder: 0,
        dropRedeemOrder: 50,
        tinInvestOrder: 200,
        dropInvestOrder: 200,
      }

      const result = await tinlake.calculateOptimalSolution(state, orderState)

      // The full redeem is possible, while only 350/400 of total invest orders are possible.
      // TIN investments have preference over DROP investments, so the full TIN invest order is fulfilled, while the tin invest order is limited by 150.
      assert.equal(result.status, 5)
      assert.equal(result.z > 0, true)
      assert.equal(result.vars.tinRedeem, 0)
      assert.equal(result.vars.dropRedeem, 50)
      assert.equal(result.vars.tinInvest, 200)
      assert.equal(result.vars.dropInvest, 150)
    })

    it('should return no feasible solution if the input state is unhealthy', async () => {
      const state = {
        netAssetValue: 800,
        reserve: 200,
        seniorDebt: 700,
        seniorBalance: 100,
        minTinRatio: 0.01,
        maxTinRatio: 0.01,
        maxReserve: 500,
      }

      const orderState = {
        tinRedeemOrder: 100,
        dropRedeemOrder: 200,
        tinInvestOrder: 300,
        dropInvestOrder: 400,
      }

      const result = await tinlake.calculateOptimalSolution(state, orderState)
      assert.equal(result.status, 4)
      assert.equal(result.z, 0)
    })

    it('should return a feasible solution if the input state is unhealthy, but a feasible solution can be found using the orders', async () => {
      const state = {
        netAssetValue: 800,
        reserve: 200,
        seniorDebt: 700,
        seniorBalance: 100,
        minTinRatio: 0.01,
        maxTinRatio: 0.01,
        maxReserve: 50000,
      }

      const orderState = {
        tinRedeemOrder: 10000,
        dropRedeemOrder: 10000,
        tinInvestOrder: 10000,
        dropInvestOrder: 10000,
      }

      const result = await tinlake.calculateOptimalSolution(state, orderState)

      assert.equal(result.status, 5)
      assert.equal(result.z > 0, true)
      assert.equal(result.vars.tinRedeem > 0, true)
      assert.equal(result.vars.dropRedeem > 0, true)
      assert.equal(result.vars.tinInvest > 0, true)
      assert.equal(result.vars.dropInvest > 0, true)
    })
  })
})
