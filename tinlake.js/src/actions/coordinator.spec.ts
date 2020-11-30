import assert from 'assert'
import { ITinlake } from '../types/tinlake'
import { createTinlake } from '../test/utils'
import testConfig from '../test/config'
import { ethers } from 'ethers'

let tinlake: ITinlake

const { SUCCESS_STATUS } = testConfig

describe('coordinator tests', async () => {
  before(async () => {
    tinlake = createTinlake(testConfig.godAccount, testConfig)
  })

  it('should be able to get the epoch state', async () => {
    const state = await tinlake.getEpochState()
    assert(state.reserve >= 0)
    assert(state.netAssetValue >= 0)
    assert(state.seniorAsset >= 0)
    assert(state.minTinRatio >= 0 && state.minTinRatio <= 1.0)
    assert(state.maxTinRatio >= 0 && state.maxTinRatio <= 1.0)
    assert(state.maxReserve >= 0)
  })

  it('should be able to get the order state', async () => {
    const coordinator = tinlake.contract('COORDINATOR')

    const submissionPeriod = await coordinator.submissionPeriod()
    assert(submissionPeriod === true || submissionPeriod === false)

    const order = await coordinator.order()
    assert(order.seniorRedeem instanceof ethers.BigNumber)

    const lastEpochExecuted = await coordinator.lastEpochExecuted()
    assert(lastEpochExecuted instanceof ethers.BigNumber)

    const epochNAV = await coordinator.epochNAV()
    assert(epochNAV instanceof ethers.BigNumber)
  })
})
