import assert from 'assert'
import { ITinlake } from '../types/tinlake'
import { createTinlake } from '../test/utils'
import testConfig from '../test/config'
import { ethers } from 'ethers'

let tinlake: ITinlake

describe('coordinator tests', async () => {
  before(async () => {
    console.log('create tinlake')
    tinlake = createTinlake(testConfig.godAccount, testConfig)
  })

  it('should be able to retrieve the orders and other epoch-related info', async () => {
    const coordinator = tinlake.contract('COORDINATOR')

    const submissionPeriod = await coordinator.submissionPeriod()
    assert(submissionPeriod === true || submissionPeriod === false)

    const order = await coordinator.order()
    assert(order.seniorRedeem instanceof ethers.utils.BigNumber)

    const lastEpochExecuted = await coordinator.lastEpochExecuted()
    assert(lastEpochExecuted instanceof ethers.utils.BigNumber)

    const epochNAV = await coordinator.epochNAV()
    assert(epochNAV instanceof ethers.utils.BigNumber)
  })

  it('should be able to get the epoch state', async () => {
    const state = await tinlake.getEpochState()
    console.log('epoch state', state)
  })
})
