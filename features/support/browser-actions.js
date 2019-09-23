const { expect } = require("chai")
const scope = require('./scope')
const selectors = require('./selectors')
const fs = require('fs')

const headless = false
let slowMo = 100

async function openBrowser() {

  /*
  scope.browser = await scope.driver.launch({
    headless, slowMo, args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
    ]
  })
  */

  scope.browser  = await scope.provider.launch(scope.driver)
  scope.wallet = await scope.provider.getMetamask(scope.browser)

  await scope.wallet.switchNetwork('kovan')
  scope.context = {}
}

async function openPage(url) {
  scope.context.currentPage = await scope.browser.newPage()
  await scope.context.currentPage.goto(url, {
    waitUntil: ['load'],
  })
}

async function closeBrowser() {
  if (scope.browser) {
    await scope.browser.close()
  }
}

async function takeScreenshot() {
  await scope.context.currentPage.screenshot({ path: 'screenshots/error-occured-here.png' })
}

module.exports = {
  openPage,
  openBrowser,
  closeBrowser,
  takeScreenshot
} 
