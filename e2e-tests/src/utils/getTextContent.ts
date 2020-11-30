import { ElementHandle } from 'puppeteer'

export async function getTextContent(element: ElementHandle): Promise<string> {
  return await element.evaluate((element: Element) => (element as any).textContent)
}
