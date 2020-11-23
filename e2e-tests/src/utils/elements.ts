import { Page } from 'puppeteer'

import { waitUntil } from './waitUntil'

export const isElementVisible = async (page: Page, xpathSelector: string, timeout?: number) => {
  let visible = true
  await page.waitForXPath(xpathSelector, { visible: true, timeout: timeout || 2000 }).catch(() => {
    visible = false
  })
  return visible
}

export const waitUntilElementsIsVisible = async (page: Page, xpathSelector: string) => {
  await waitUntil(
    async () => {
      const element = await isElementVisible(page, xpathSelector, 50)
      return element === true
    },
    { errorMsg: `Expected element to appear` }
  )
}

export const waitUntilElementsIsInvisible = async (page: Page, xpathSelector: string) => {
  await waitUntil(
    async () => {
      const element = await isElementVisible(page, xpathSelector, 50)
      return element === false
    },
    { errorMsg: `Expected element to appear` }
  )
}