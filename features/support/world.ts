import { setWorldConstructor, setDefaultTimeout } from 'cucumber';
import { Browser, Page } from 'puppeteer';
import { Dappeteer } from 'dappeteer';

export class CentrifugeWorld {

  browser: null | Browser = null
  metamask: null | Dappeteer = null
  currentPage: null | Page = null

  constructor() {
  }
}

setDefaultTimeout(30 * 1000)
setWorldConstructor(CentrifugeWorld)
