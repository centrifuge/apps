import * as puppeteer from 'puppeteer'
import * as dappeteer from 'dappeteer'

import { CentrifugeWorld } from './world'
import { config } from '../config'

export async function openBrowser(world: CentrifugeWorld) {
  // console.log('Using chromium at', puppeteer.executablePath())

  world.browser = await dappeteer.launch(puppeteer, {
    headless: false,
    slowMo: 0,
    devtools: false,
    args: [
      // Required for Docker version of Puppeteer
      '--no-sandbox',
      '--disable-setuid-sandbox',
      // This will write shared memory files into /tmp instead of /dev/shm,
      // because Docker’s default for /dev/shm is 64MB
      '--disable-dev-shm-usage',
    ],
  })
}

export async function openPage(world: CentrifugeWorld, url: string) {
  world.currentPage = await world.browser.newPage()
  await world.currentPage.goto(url, {
    waitUntil: ['load'],
  })
}

export async function openPoolPage(world: CentrifugeWorld, path: string) {
  world.currentPage = await world.browser.newPage()
  const url = `${config.tinlakeUrl}pool/${config.pool.addresses.ROOT_CONTRACT}/${config.pool.slug}/${path}`
  await world.currentPage.goto(url, {
    waitUntil: ['load'],
  })
}

export async function closeBrowser(world: CentrifugeWorld) {
  if (world.browser) {
    await world.browser.close()
  }
}

export async function takeScreenshot(world: CentrifugeWorld, path = './screenshots/error-occured-here.png') {
  await world.currentPage.screenshot({ path })
}
