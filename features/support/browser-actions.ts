import * as puppeteer from 'puppeteer'
import * as dappeteer from 'dappeteer'
import { CentrifugeWorld } from './world'
import { config } from "./config";

export async function openBrowser(world: CentrifugeWorld) {
  // console.log('Using chromium at', puppeteer.executablePath())

  world.browser = await dappeteer.launch(puppeteer, {
    headless: false,
    slowMo: 0,
    devtools: false,
    args: [
      // '--no-sandbox',
      // '--disable-setuid-sandbox',
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
  const url = `${config.tinlakeUrl}/pool/${config.tinlakePool.addresses.ROOT_CONTRACT}/${config.tinlakePool.slug}/${path}`;
  await world.currentPage.goto(url, {
    waitUntil: ["load"],
  });
}

export async function closeBrowser(world: CentrifugeWorld) {
  if (world.browser) {
    await world.browser.close()
  }
}

export async function takeScreenshot(world: CentrifugeWorld, path = './screenshots/error-occured-here.png') {
  await world.currentPage.screenshot({ path })
}

