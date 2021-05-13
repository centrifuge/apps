import { ITinlake } from '@centrifuge/tinlake-js'
import { setDefaultTimeout, setWorldConstructor } from '@cucumber/cucumber'
import * as dappeteer from 'dappeteer'
import { Browser, Page } from 'puppeteer'
import { config } from '../config'
import { tinlake } from '../selectors'
import { waitUntilElementsIsInvisible, waitUntilElementsIsVisible } from '../utils/elements'
import { ensureTinlakeInit } from './tinlake-actions'

export class CentrifugeWorld {
  browser: Browser
  currentPage: Page
  private metamask: dappeteer.Dappeteer

  tinlake: ITinlake
  context: { [key: string]: any } = {}

  async initializedTinlake() {
    return await ensureTinlakeInit(this)
  }

  clearContext() {
    this.context = {}
  }

  async metamaskInit() {
    this.metamask = await dappeteer.getMetamask(this.browser!)
  }

  async metamaskImportAdminPK() {
    await this.metamask.importPK(config.ethAdminPrivateKey)
  }

  async metamaskImportBorrowerPK() {
    await this.metamask.importPK(config.ethBorrowerPrivateKey)
  }

  async metamaskSwitchNetwork() {
    await this.metamask.switchNetwork(config.ethNetwork)
  }

  // Wrap Dappeteer metamask actions so we can bring the current page back to front after interacting with metamask
  async metamaskApprove() {
    // @ts-ignore
    await this.metamask.approve()
    await this.currentPage.bringToFront()
  }

  async metamaskSignAndConfirmTransaction(options: dappeteer.TransactionOptions) {
    await this.currentPage.waitFor(1000)
    await this.metamask.sign()
    await this.currentPage.bringToFront()
    await this.metamask.confirmTransaction(options)
    await this.currentPage.bringToFront()
    await this.waitForSuccessfulTransaction()
  }

  async metamaskConfirmTransaction(options: dappeteer.TransactionOptions) {
    await this.metamask.confirmTransaction(options)
    await this.currentPage.bringToFront()
    await this.waitForSuccessfulTransaction()
  }

  // Wait until the pending toast shows up, the pending toast goes away again, and the success toast shows up
  async waitForSuccessfulTransaction() {
    await waitUntilElementsIsVisible(this.currentPage, tinlake('pendingTransaction'))
    // TODO: store toast name and pass to next to checks
    await waitUntilElementsIsInvisible(this.currentPage, tinlake('pendingTransaction'))
    await waitUntilElementsIsVisible(this.currentPage, tinlake('successfulTransaction'))
  }
}

setDefaultTimeout(100 * 1000)
setWorldConstructor(CentrifugeWorld)
