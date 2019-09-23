const { Given, When, Then } = require("cucumber");
const {
  openPage,
  takeScreenshot
}  = require('./browser-actions')
const { getConfig } = require('../config')
const config = getConfig()
const increasedTimeout = {
  timeout: 5 * 60 * 1000
}

Given("I am on the Gateway Page", increasedTimeout, async function() {
  console.log("url", config.gatewayUrl)
  return await openPage(config.gatewayUrl)
  .catch( async ( err ) => {
    await handleTimeoutError(err)
  })
})

When("", increasedTimeout, async function() {
  return
})

Then("", increasedTimeout, async function() {
  return
})

async function handleTimeoutError(err) {
  await takeScreenshot()  
  throw err
}
