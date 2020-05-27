// Dependencies
import { After, Before, AfterAll, Status } from 'cucumber'
import { openBrowser, closeBrowser, takeScreenshot } from './browser-actions'
import { initMetamask } from './ethereum-actions'
import { CentrifugeWorld } from './world'

Before(async function(this: CentrifugeWorld, scenario) {
  await openBrowser(this)
  await initMetamask(this)
})

After( async function(this: CentrifugeWorld, scenario) {
  if (scenario.result.exception || scenario.result.status === Status.FAILED) {
    console.log('exception or failure – will take a screenshot')

    await takeScreenshot(this, './screenshots/scenario-failed.png')

    // return if not on CI, which keeps the browser open for debugging
    if (!process.env.CI) {
      console.log('skipping close browser')
      return
    }
  }
  console.log('closing browser')

  await closeBrowser(this)
})
