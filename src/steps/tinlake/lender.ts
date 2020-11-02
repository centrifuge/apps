import { Given, When } from '@cucumber/cucumber'

import { CentrifugeWorld } from '../../support/world'
import { tinlake } from '../../selectors'

Given('I have clicked the Invest button for the TIN tranche', async function(this: CentrifugeWorld) {
  const button = await this.currentPage.waitForXPath(tinlake('investmentsPage.tinInvest.investButton'))
  await button.click()
})

When('I set the investment amount to {float} DAI', async function(this: CentrifugeWorld, amount: number) {
  const input = await this.currentPage.waitForXPath(tinlake('investmentsPage.tinInvest.amountInput'))
  await input.click({ clickCount: 3 }) // triple click to select all content
  await input.type(`${amount}`)

  const button = await this.currentPage.waitForXPath(tinlake('investmentsPage.tinInvest.lockDAIButton'))
  await button.click()

  await this.metamaskConfirmTransaction({ gas: 50, gasLimit: 1000000 })

  // Changing values can take a few seconds to process
  await this.currentPage.waitFor(3000)
})
