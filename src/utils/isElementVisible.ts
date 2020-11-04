import { Page } from 'puppeteer'

export const isElementVisible = async (page: Page, xpathSelector: string) => {
  let visible = true
  await page.waitForXPath(xpathSelector, { visible: true, timeout: 2000 }).catch(() => {
    visible = false
  })
  return visible
}
