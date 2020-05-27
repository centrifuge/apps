// Dependencies
import { After, Before, AfterAll, Status } from 'cucumber'
import { openBrowser, closeBrowser, takeScreenshot } from './browser-actions'
import { initMetamask } from './ethereum-actions'

Before(async function(scenario) {
  await openBrowser(this as any)
  await initMetamask(this as any)
})

After( async function(scenario) {
  if (scenario.result.status === Status.FAILED) {
    await takeScreenshot(this as any, 'screenshots/scenario-failed.png')
  }

  await closeBrowser(this as any)
})
