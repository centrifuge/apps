import * as puppeteer from 'puppeteer'
import * as dappeteer from 'dappeteer'
import { CentrifugeWorld } from './world'

const headless = false
let slowMo = 10

export async function openBrowser(world: CentrifugeWorld) {
  world.browser = await dappeteer.launch(puppeteer, { headless, slowMo, args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
  ]})
}

export async function openPage(world: CentrifugeWorld, url: string) {
  world.currentPage = await world.browser.newPage()
  await world.currentPage.goto(url, {
    waitUntil: ['load'],
  })
}

export async function closeBrowser(world: CentrifugeWorld) {
  if (world.browser) {
    await world.browser.close()
  }
}

export async function takeScreenshot(world: CentrifugeWorld, path = 'screenshots/error-occured-here.png') {
  await world.currentPage.screenshot({ path })
}

