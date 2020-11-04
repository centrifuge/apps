import { setWorldConstructor, setDefaultTimeout } from '@cucumber/cucumber'
import { Browser, Page } from 'puppeteer'
import { ITinlake } from '@centrifuge/tinlake-js'
import * as dappeteer from 'dappeteer-test'
import * as assert from 'assert'

import { ensureTinlakeInit } from './tinlake-actions'
import { config } from '../config'
import { isElementVisible } from '../utils/isElementVisible'
import { tinlake } from '../selectors'

export class CentrifugeWorld {
  browser: null | Browser = null
  currentPage: null | Page = null
  // wrap all Dappeteer metamask actions so we can bring the current page back to front after interacting with metamask
  private metamask: null | dappeteer.Dappeteer = null
  tinlake: null | ITinlake = null
  context: { [key: string]: any } = {}

  constructor() {}

  async initializedTinlake() {
    return await ensureTinlakeInit(this)
  }

  clearContext() {
    this.context = {}
  }

  async metamaskInit() {
    this.metamask = await dappeteer.getMetamask(this.browser)
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

  // wrap Dappeteer metamask actions so we can bring the current page back to front after interacting with metamask
  async metamaskApprove() {
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

  async waitForSuccessfulTransaction() {
    // TODO: in parallel, wait for failed tx text and return false immediately if it shows up. Now, we wait 30s even if it immediately fails
    const successfulTxExists = await isElementVisible(this.currentPage, tinlake('successfulTransaction'), config.transactionTimeout)
    assert.strictEqual(successfulTxExists, true)
  }
}

setDefaultTimeout(100 * 1000)
setWorldConstructor(CentrifugeWorld)
