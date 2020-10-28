import { Given, When, Then } from 'cucumber'
import { displayToBase } from '@centrifuge/tinlake-js'
import * as assert from 'assert'

import { config } from '../config'
import { CentrifugeWorld } from '../support/world'
import { selectors } from '../selectors'
import { getTextContent } from '../utils/getTextContent'
import { waitUntil } from '../utils/waitUntil'

Given('the min TIN ratio is set to {int}%', async function(this: CentrifugeWorld, int: number) {
  const tinlake = await this.initializedTinlake()
  const newVal = displayToBase(`${int}`, 27 - 2) // 27 is the default, but the int is given in percentage points

  const setTx = await tinlake.setMinimumJuniorRatio(newVal)
  await tinlake.getTransactionReceipt(setTx)

  const afterVal = (await tinlake.getMinJuniorRatio()).toString()
  assert.equal(newVal, afterVal)
})

Given('I have set the NFT reference to {string}', async function(this: CentrifugeWorld, string: string) {
  const input = await this.currentPage.waitForXPath(selectors.tinlake.mintNFTReferenceInput)
  await input.click({ clickCount: 3 }) // triple click to select all content
  await input.type(string)
})

When('I set Min TIN ratio to {int}%', async function(this: CentrifugeWorld, int: number) {
  const input = await this.currentPage.waitForXPath(selectors.tinlake.minTINRatioInput)
  await input.click({ clickCount: 3 }) // triple click to select all content
  await input.type(`${int}`)

  const button = await this.currentPage.waitForXPath(selectors.tinlake.setMinTINRatioButton)
  await button.click()

  await this.metamaskConfirmTransaction({ gas: 50, gasLimit: 100000 })
})

When('I do mint NFT', async function(this: CentrifugeWorld) {
  debugger
  const button = await this.currentPage.waitForXPath(selectors.tinlake.mintNFTButton)
  await button.click()

  // await this.currentPage.waitFor(10000)

  await this.metamaskConfirmTransaction({ gas: 50, gasLimit: 300000 })
})

Then('I see that Min TIN ratio component is set to {int}%', async function(this: CentrifugeWorld, int: number) {
  const expected = `${int}.00%`
  let actual = ''
  await waitUntil(
    async () => {
      const display = await this.currentPage.waitForXPath(selectors.tinlake.minTINRatioDisplay)
      actual = await getTextContent(display)

      return actual === expected
    },
    { errorMsg: `expected min tin ratio display to show ${int} %, but got ${actual}` }
  )
})

Then('I see that NFT ID is shown in UI', async function(this: CentrifugeWorld) {
  const alert = await this.currentPage.waitForXPath(selectors.tinlake.mintNFTSuccessAlert)
  const text = await getTextContent(alert)

  const regex = /Successfully minted NFT for Token ID ([0-9]+)/
  const result = regex.exec(text)

  this.context.nftID = result[1]

  // console.log('NFT ID:', this.context.nftID)

  assert.ok(this.context.nftID, 'NFT ID must not be empty')
})

Then('that minted NFT is in my wallet', async function(this: CentrifugeWorld) {
  const tinlake = await this.initializedTinlake()
  const owner = await tinlake.getNFTOwner(config.nftRegistry, this.context.nftID)

  // console.log({ owner: owner.toString() })

  assert.equal(owner.toString().toLowerCase(), config.ethBorrowerAddress.toLowerCase())
})
