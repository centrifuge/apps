import { Given, When, Then } from "cucumber"
import { openPage } from "./browser-actions"
import { config } from "./config"
import { importAdminPK, switchNetwork } from "./ethereum-actions";
import { CentrifugeWorld } from "./world";
import { selectors } from "./selectors";
import { getTextContent } from './utils/getTextContent'
import { debug } from './utils/debug'
import * as assert from 'assert'

Given("I am on the Gateway Page", async function (this: CentrifugeWorld) {
  await openPage(this, config.gatewayUrl);
});

Given('I am logged into MetaMask as Tinlake admin', async function (this: CentrifugeWorld) {
  await importAdminPK(this)
  await switchNetwork(this)
});

Given("I am on the Tinlake investments page", async function (this: CentrifugeWorld) {
  await openPage(this, `${config.tinlakeUrl}/${config.tinlakePoolRoot}/investments`);
});

Given("I am connected to Tinlake", async function (this: CentrifugeWorld) {
  const connect = await this.currentPage.waitForXPath(selectors.tinlake.connectButton)
  await connect.click()
  const metamask = await this.currentPage.waitForXPath(selectors.tinlake.web3modalMetamaskButton)
  await metamask.click()
  await this.metamask.approve()
});

When('I set Min TIN ratio to {int}%', async function (this: CentrifugeWorld, int: number) {
  const input = await this.currentPage.waitFor(selectors.tinlake.minTINRatioInput)
  await input.click({ clickCount: 3 })
  await input.type(`${int}`)

  await debug(this)

  const button = await this.currentPage.waitForXPath(selectors.tinlake.setMinTINRatioButton)
  await button.click()

  await this.metamask.confirmTransaction({ gas: 50, gasLimit: 50000 })
});

Then('I see that Min TIN ratio component is set to {int}%', async function (this: CentrifugeWorld, int: number) {
  const display = await this.currentPage.waitFor(selectors.tinlake.minTINRatioDisplay)
  const content = await getTextContent(display)
  await debug(this)

  assert.equal(content, `${int}%%`)
});
