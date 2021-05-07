import { Given } from '@cucumber/cucumber'
import { config } from '../../config'
import { openPage } from '../../support/browser-actions'
import { CentrifugeWorld } from '../../support/world'

Given('I am on the Gateway Page', async function (this: CentrifugeWorld) {
  await openPage(this, config.gatewayUrl)
})
