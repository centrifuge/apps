import { Given } from '@cucumber/cucumber'
import * as assert from 'assert'

import { openPoolPage } from '../../support/browser-actions'
import { CentrifugeWorld } from '../../support/world'
import { tinlake } from '../../selectors'

Given('I am logged into MetaMask as Tinlake admin', async function(this: CentrifugeWorld) {
  await this.metamaskImportAdminPK()
  await this.metamaskSwitchNetwork()
})

Given('I am logged into MetaMask as borrower', async function(this: CentrifugeWorld) {
  await this.metamaskImportBorrowerPK()
  await this.metamaskSwitchNetwork()
})

Given('I am on the Tinlake investments page', async function(this: CentrifugeWorld) {
  await openPoolPage(this, 'investments')
})

Given('I have reloaded the page', async function(this: CentrifugeWorld) {
  await this.currentPage.reload({ waitUntil: ['networkidle0', 'domcontentloaded'] })
})

Given('I am on the Tinlake mint NFT page', async function(this: CentrifugeWorld) {
  await openPoolPage(this, 'demo/mint-nft')
})

Given('I am connected to Tinlake', async function(this: CentrifugeWorld) {
  const connect = await this.currentPage.waitForXPath(tinlake('connectButton'))
  await connect.click()

  const metamask = await this.currentPage.waitForXPath(tinlake('onboardMetamaskButton'))

  await metamask.click()
  await this.metamaskApprove()
})

// Given('the transaction was successful', async function(this: CentrifugeWorld) {
//   console.log('Wiating for green tx')
//   const successfulTxExists = await isElementVisible(this.currentPage, tinlake('successfulTransaction'), 30000)
//   assert.strictEqual(successfulTxExists, true)
//   console.log('Found green tx')
// })
