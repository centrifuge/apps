// Dependencies
const { After, Before, AfterAll, Status } = require('cucumber')
const {
  openBrowser,
  closeBrowser,
  takeScreenshot,
}  = require('./browser-actions')
const { initMetamask } = require('./ethereum-actions')

Before( async function(scenario) {
  await openBrowser(this)
  await initMetamask(this)
})

After( async function(scenario) {
  if (scenario.result.status === Status.FAILED) {
    await takeScreenshot(this, 'screenshots/scenario-failed.png')
  }

  await closeBrowser(this)
})
