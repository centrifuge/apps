import { Given } from 'cucumber'

import { openPage } from '../../support/browser-actions'
import { config } from '../../config'
import { CentrifugeWorld } from '../../support/world'

Given('I am on the Gateway Page', async function(this: CentrifugeWorld) {
  await openPage(this, config.gatewayUrl)
})
