import { Given } from 'cucumber'

import { openPoolPage } from '../../support/browser-actions'
import { CentrifugeWorld } from '../../support/world'
import tinlakeSelectors from '../../selectors/tinlake'

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

Given('I am on the Tinlake mint NFT page', async function(this: CentrifugeWorld) {
  await openPoolPage(this, 'demo/mint-nft')
})

Given('I am connected to Tinlake', async function(this: CentrifugeWorld) {
  const connect = await this.currentPage.waitForXPath(tinlakeSelectors.connectButton)
  console.log('connect', connect)
  await connect.click()

  const metamask = await this.currentPage.waitForXPath(tinlakeSelectors.onboardMetamaskButton)
  console.log('metamask', metamask)

  await metamask.click()
  await this.currentPage.waitFor(2000)
  await this.metamaskApprove()
  await this.currentPage.waitFor(2000)
})
