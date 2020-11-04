import { Page } from 'puppeteer'

export const isElementVisible = async (page: Page, xpathSelector: string, timeout?: number) => {
  let visible = true
  await page.waitForXPath(xpathSelector, { visible: true, timeout: timeout || 2000 }).catch(() => {
    visible = false
  })
  return visible
}
