const puppeteer = require('puppeteer');
const dappeteer = require('dappeteer')
const fs = require('fs')
const { CentrifugeWorld } = require('./world')

const headless = false
let slowMo = 10

/**
 * @param {CentrifugeWorld} world
 */
async function openBrowser(world) {
  world.browser = await dappeteer.launch(puppeteer, { headless, slowMo, args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
  ]})
}

/**
 * @param {CentrifugeWorld} world
 * @param {string} url
 */
async function openPage(world, url) {
  world.currentPage = await world.browser.newPage()
  await world.currentPage.goto(url, {
    waitUntil: ['load'],
  })
}

/**
 * @param {CentrifugeWorld} world
 */
async function closeBrowser(world) {
  if (world.browser) {
    await world.browser.close()
  }
}

/**
 * @param {CentrifugeWorld} world
 * @param {string} path
 */
async function takeScreenshot(world, path = 'screenshots/error-occured-here.png') {
  await world.currentPage.screenshot({ path })
}

module.exports = {
  openPage,
  openBrowser,
  closeBrowser,
  takeScreenshot
}
