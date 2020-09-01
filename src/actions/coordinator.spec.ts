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
    it('should return an optimal solution for the epoch orders', async () => {
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
      
      console.log()
      console.log(result.vars)
      console.log()
      
      assert.equal(result.vars.dropRedeem, 300)
      assert.equal(result.vars.tinRedeem, 100)
      assert.equal(result.vars.tinInvest, 125)
      assert.equal(result.vars.dropInvest, 400)
    })
  })
})
