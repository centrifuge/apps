import { Given, When, Then } from '@cucumber/cucumber'
import * as assert from 'assert'

import { CentrifugeWorld } from '../../support/world'
import { tinlake } from '../../selectors'
import { isElementVisible } from '../../utils/isElementVisible'

type Order = 'invest' | 'redeem'
type Tranche = 'DROP' | 'TIN'

Given('there is no outstanding order or collection for the {tranche} tranche', async function(
  this: CentrifugeWorld,
  tranche: Tranche
) {
  const hasOutstandingOrder = await isElementVisible(
    this.currentPage,
    tinlake(tranche === 'DROP' ? 'investmentsPage.dropCard.cancelOrderButton' : 'investmentsPage.tinCard.cancelOrderButton')
  )
  assert.strictEqual(hasOutstandingOrder, false)

  const hasCollection = await isElementVisible(
    this.currentPage,
    tinlake(tranche === 'DROP' ? 'investmentsPage.dropCard.collectButton' : 'investmentsPage.tinCard.collectButton')
  )
  assert.strictEqual(hasCollection, false)
})

When('I {order} {int} DAI for {tranche}', async function(this: CentrifugeWorld, order: Order, amount: number, tranche: Tranche) {
  // TODO: implement redeem (invest/redeemButton)
  const investButton = await this.currentPage.waitForXPath(
    tinlake(tranche === 'DROP' ? 'investmentsPage.dropCard.investButton' : 'investmentsPage.tinCard.investButton')
  )
  await investButton.click()

  const input = await this.currentPage.waitForXPath(
    tinlake(tranche === 'DROP' ? 'investmentsPage.dropCard.amountInput' : 'investmentsPage.tinCard.amountInput')
  )
  await input.click({ clickCount: 3 }) // triple click to select all content
  await input.type(`${amount}`)

  // TODO: implement redeem (lockDROP/TINButton)
  const lockButton = await this.currentPage.waitForXPath(
    tinlake(tranche === 'DROP' ? 'investmentsPage.dropCard.lockDAIButton' : 'investmentsPage.tinCard.lockDAIButton')
  )
  await lockButton.click()
  
  await this.metamaskSignAndConfirmTransaction({ gas: 50, gasLimit: 1000000 })

  // Changing values can take a few seconds to process
  await this.currentPage.waitFor(3000)
})

When('I cancel my {tranche} order', async function(this: CentrifugeWorld, tranche: Tranche) {
  const button = await this.currentPage.waitForXPath(
    tinlake(tranche === 'DROP' ? 'investmentsPage.dropCard.cancelOrderButton' : 'investmentsPage.tinCard.cancelOrderButton')
  )
  await button.click()

  await this.metamaskConfirmTransaction({ gas: 50, gasLimit: 1000000 })

  // Changing values can take a few seconds to process
  await this.currentPage.waitFor(3000)
})

Then('there is an outstanding order for the {tranche} tranche', async function(this: CentrifugeWorld, tranche: Tranche) {
  const hasOutstandingOrder = await isElementVisible(
    this.currentPage,
    tinlake(tranche === 'DROP' ? 'investmentsPage.dropCard.cancelOrderButton' : 'investmentsPage.tinCard.cancelOrderButton')
  )
  assert.strictEqual(hasOutstandingOrder, true)
})
