const { setWorldConstructor, setDefaultTimeout } = require('cucumber');
const puppeteer = require('puppeteer');
const dappeteer =  require('dappeteer')

class CentrifugeWorld {

  /** @type {null | puppeteer.Browser} */
  browser = null
  /** @type {null | dappeteer.Dappeteer} */
  metamask = null
  /** @type {null | puppeteer.Page} */
  currentPage = null

  constructor() {
  }
}

setDefaultTimeout(30 * 1000)
setWorldConstructor(CentrifugeWorld)

module.exports = { CentrifugeWorld }
