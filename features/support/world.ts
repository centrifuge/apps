import { setWorldConstructor, setDefaultTimeout } from 'cucumber';
import { Browser, Page } from 'puppeteer';
import { Dappeteer } from 'dappeteer';
import { ITinlake } from 'tinlake';
import { ensureTinlakeInit } from './tinlake-actions';

export class CentrifugeWorld {

  browser: null | Browser = null
  metamask: null | Dappeteer = null
  currentPage: null | Page = null
  tinlake: null | ITinlake = null
  context: {[key: string]: any} = {}

  constructor() {
  }

  async initializedTinlake() {
    return await ensureTinlakeInit(this)
  }

  clearContext() {
    this.context = {}
  }
}

setDefaultTimeout(100 * 1000)
setWorldConstructor(CentrifugeWorld)
