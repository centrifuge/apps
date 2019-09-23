// Dependencies
const { After, Before, AfterAll } = require('cucumber')
const {
  openBrowser,
  closeBrowser
}  = require('./browser-actions')

Before( async function(scenario) {
  await openBrowser()
})

After( async function(scenario) {
  const status = scenario.result.status
  await closeBrowser()
})
