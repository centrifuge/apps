import { Given, Then, When } from '@cucumber/cucumber'
import * as assert from 'assert'
import { tinlake } from '../../selectors'
import { CentrifugeWorld } from '../../support/world'
import { isElementVisible } from '../../utils/elements'

type Order = 'invest' | 'redeem'
type Tranche = 'DROP' | 'TIN'

Given('there is no outstanding order or collection for the {tranche} tranche', async function(
  this: CentrifugeWorld,
  tranche: Tranche
) {
  const hasOutstandingOrder = await isElementVisible(
    this.currentPage,
    tinlake(
      tranche === 'DROP' ? 'investmentsPage.dropCard.cancelOrderButton' : 'investmentsPage.tinCard.cancelOrderButton'
    )
  )
  assert.strictEqual(hasOutstandingOrder, false)

  const hasCollection = await isElementVisible(
    this.currentPage,
    tinlake(tranche === 'DROP' ? 'investmentsPage.dropCard.collectButton' : 'investmentsPage.tinCard.collectButton')
  )
  assert.strictEqual(hasCollection, false)
})

When('I {order} {int} DAI for {tranche}', async function(
  this: CentrifugeWorld,
  order: Order,
  amount: number,
  tranche: Tranche
) {
  const chooseOrderButton = await this.currentPage.waitForXPath(
    tinlake(
      tranche === 'DROP'
        ? order === 'invest'
          ? 'investmentsPage.dropCard.investButton'
          : 'investmentsPage.dropCard.redeemButton'
        : order === 'invest'
        ? 'investmentsPage.tinCard.investButton'
        : 'investmentsPage.tinCard.redeemButton'
    )
  )
  await chooseOrderButton.click()

  const input = await this.currentPage.waitForXPath(
    tinlake(tranche === 'DROP' ? 'investmentsPage.dropCard.amountInput' : 'investmentsPage.tinCard.amountInput')
  )
  await input.click({ clickCount: 3 }) // triple click to select all content
  await input.type(`${amount}`)

  const lockButton = await this.currentPage.waitForXPath(
    tinlake(
      tranche === 'DROP'
        ? order === 'invest'
          ? 'investmentsPage.dropCard.lockDAIButton'
          : 'investmentsPage.dropCard.lockDROPButton'
        : order === 'invest'
        ? 'investmentsPage.tinCard.lockDAIButton'
        : 'investmentsPage.tinCard.lockTINButton'
    )
  )
  await lockButton.click()

  await this.metamaskSignAndConfirmTransaction({ gas: 50, gasLimit: 1000000 })
})

When('I cancel my {tranche} order', async function(this: CentrifugeWorld, tranche: Tranche) {
  const button = await this.currentPage.waitForXPath(
    tinlake(
      tranche === 'DROP' ? 'investmentsPage.dropCard.cancelOrderButton' : 'investmentsPage.tinCard.cancelOrderButton'
    )
  )
  await this.currentPage.waitFor(100)
  await button.click()
  await this.currentPage.waitFor(100)

  const confirmButton = await this.currentPage.waitForXPath(
    tinlake(
      tranche === 'DROP'
        ? 'investmentsPage.dropCard.confirmCancellationButton'
        : 'investmentsPage.tinCard.confirmCancellationButton'
    )
  )
  await confirmButton.click()

  await this.metamaskConfirmTransaction({ gas: 50, gasLimit: 1000000 })

  // Changing values can take a few seconds to process
  await this.currentPage.waitFor(3000)
})

Then('there is an outstanding order for the {tranche} tranche', async function(
  this: CentrifugeWorld,
  tranche: Tranche
) {
  const hasOutstandingOrder = await isElementVisible(
    this.currentPage,
    tinlake(
      tranche === 'DROP' ? 'investmentsPage.dropCard.cancelOrderButton' : 'investmentsPage.tinCard.cancelOrderButton'
    ),
    10000
  )
  assert.strictEqual(hasOutstandingOrder, true)
})
