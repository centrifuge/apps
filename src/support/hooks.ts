// Dependencies
import { After, AfterAll, Before, Status } from 'cucumber'

import { openBrowser, closeBrowser, takeScreenshot } from './browser-actions'
import { CentrifugeWorld } from './world'

Before(async function(this: CentrifugeWorld, scenario) {
  this.clearContext()

  await openBrowser(this)
  await this.metamaskInit()
})

After(async function(this: CentrifugeWorld, scenario) {
  this.clearContext()

  if (scenario.result.exception || scenario.result.status === Status.FAILED) {
    console.log('Exception or failure – will take a screenshot')

    await takeScreenshot(this, `./screenshots/scenario-${scenario.pickle.name}-failed.png`)

    // return if not on CI, which keeps the browser open for debugging
    if (!process.env.CI) {
      console.log('Skipping close browser')
      return
    }
  }
  console.log('Closing browser')

  await closeBrowser(this)
})
