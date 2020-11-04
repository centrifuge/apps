import { Given, When, Then } from '@cucumber/cucumber'
import { displayToBase } from '@centrifuge/tinlake-js'
import * as assert from 'assert'
const BN = require('bn.js')

import { config } from '../../config'
import { CentrifugeWorld } from '../../support/world'
import { tinlake } from '../../selectors'
import { getTextContent } from '../../utils/getTextContent'
import { waitUntil } from '../../utils/waitUntil'

Given('the min TIN ratio is set to {int}%', async function(this: CentrifugeWorld, minTinRatio: number) {
  const tinlake = await this.initializedTinlake()
  const newVal = displayToBase(`${minTinRatio}`, 27 - 2) // 27 is the default, but the int is given in percentage points

  const setTx = await tinlake.setMinimumJuniorRatio(newVal)
  await tinlake.getTransactionReceipt(setTx)

  const afterVal = (await tinlake.getMinJuniorRatio()).toString()
  assert.strictEqual(newVal, afterVal)

  // Changing values can take a few seconds to process
  this.currentPage.waitFor(3000)
})

Given('the max reserve amount is set to X', async function(this: CentrifugeWorld) {
  const tinlake = await this.initializedTinlake()
  const maxReserve = (await tinlake.getMaxReserve()).toString()
  console.log(`Max reserve is ${maxReserve}`)

  this.context.maxReserve = maxReserve
})

Given('I have set the NFT reference to {string}', async function(this: CentrifugeWorld, string: string) {
  this.currentPage.waitFor(100)
  const input = await this.currentPage.waitForXPath(tinlake('mintNFTPage.referenceInput'))
  await input.click({ clickCount: 3 }) // triple click to select all content
  await input.type(string)
})

When('I set Min TIN ratio to {int}%', async function(this: CentrifugeWorld, minTinRatio: number) {
  const input = await this.currentPage.waitForXPath(tinlake('investmentsPage.minTinRatio.input'))
  await input.click({ clickCount: 3 }) // triple click to select all content
  await input.type(`${minTinRatio}`)

  const button = await this.currentPage.waitForXPath(tinlake('investmentsPage.minTinRatio.updateButton'))
  await button.click()

  await this.metamaskConfirmTransaction({ gas: 50, gasLimit: 100000 })

  // Changing values can take a few seconds to process
  await this.currentPage.waitFor(3000)
})

When('I do mint NFT', async function(this: CentrifugeWorld) {
  const button = await this.currentPage.waitForXPath(tinlake('mintNFTPage.mintButton'))
  await button.click()

  await this.metamaskConfirmTransaction({ gas: 50, gasLimit: 300000 })
})

When('I increase the max reserve amount by 1', async function(this: CentrifugeWorld) {
  const button = await this.currentPage.waitForXPath(tinlake('assetsPage.setMaxReserveButton'))
  await button.click()

  console.log(`Current max reserve: ${this.context.maxReserve}`)
  this.context.newMaxReserve = new BN(this.context.maxReserve).add(new BN(1).mul(new BN(10).pow(new BN(18)))).divRound(new BN(18)).toString() // Add 1*10**18, then convert back
  console.log(`New max reserve: ${this.context.newMaxReserve}`)

  const input = await this.currentPage.waitForXPath(tinlake('assetsPage.setMaxReserve.input'))
  await input.click({ clickCount: 3 }) // triple click to select all content
  console.log('')
  await input.type(`${this.context.newMaxReserve}`)

  const saveButton = await this.currentPage.waitForXPath(tinlake('assetsPage.setMaxReserve.saveButton'))
  await saveButton.click()

  await this.metamaskConfirmTransaction({ gas: 50, gasLimit: 100000 })

  // Changing values can take a few seconds to process
  await this.currentPage.waitFor(3000)
})

Then('I see that Min TIN ratio component is set to {int}%', async function(this: CentrifugeWorld, minTinRatio: number) {
  const expected = `${minTinRatio}.00%`
  let actual = ''
  await waitUntil(
    async () => {
      const display = await this.currentPage.waitForXPath(tinlake('investmentsPage.minTinRatio.value'))
      actual = await getTextContent(display)

      return actual === expected
    },
    { errorMsg: `expected min tin ratio display to show ${minTinRatio} %, but got ${actual}` }
  )
})

Then('I see that the max reserve amount is set to X+1', async function(this: CentrifugeWorld) {
  console.log(`New max reserve: ${this.context.newMaxReserve}`)

  const expected = `Max: ${this.context.newMaxReserve} DAI`
  let actual = ''
  await waitUntil(
    async () => {
      const display = await this.currentPage.waitForXPath(tinlake('assetsPage.maxReserveValue'))
      actual = await getTextContent(display)

      return actual === expected
    },
    { errorMsg: `expected max reserve amount to show ${expected}, but got ${actual}` }
  )
})

Then('I can verify that the min TIN ratio is set to {int}%', async function(this: CentrifugeWorld, minTinRatio: number) {
  const tinlake = await this.initializedTinlake()
  const actualVal = (await tinlake.getMinJuniorRatio()).toString()
  
  assert.strictEqual(minTinRatio.toString() + '0'.repeat(25), actualVal)
})

Then('I see that NFT ID is shown in UI', async function(this: CentrifugeWorld) {
  const alert = await this.currentPage.waitForXPath(tinlake('mintNFTPage.successAlert'))
  const text = await getTextContent(alert)

  const regex = /Successfully minted NFT for Token ID ([0-9]+)/
  const result = regex.exec(text)

  this.context.nftID = result[1]
  assert.ok(this.context.nftID, 'NFT ID must not be empty')
})

Then('that minted NFT is in my wallet', async function(this: CentrifugeWorld) {
  const tinlake = await this.initializedTinlake()
  const owner = await tinlake.getNFTOwner(config.nftRegistry, this.context.nftID)

  assert.strictEqual(owner.toString().toLowerCase(), config.ethBorrowerAddress.toLowerCase())
})
