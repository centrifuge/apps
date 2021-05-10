import { Then } from '@cucumber/cucumber'
import * as assert from 'assert'
import { tinlake } from '../../selectors'
import { CentrifugeWorld } from '../../support/world'
import { getTextContent } from '../../utils/getTextContent'
const BN = require('bn.js')

Then('I see at least one pool in the list', async function (this: CentrifugeWorld) {
  const entries = await this.currentPage.waitForXPath(tinlake('dashboardPage.poolList.entries'))

  assert.ok((await entries.$$('*')).length > 0)
})

Then('the first pool in the list has a positive DROP APR', async function (this: CentrifugeWorld) {
  const firstVal = await this.currentPage.waitForXPath(tinlake('dashboardPage.poolList.entries.first.aprCol.value'))
  const value = await getTextContent(firstVal)

  assert.ok(parseFloat(value) > 0)
})

Then('the total financed to date amount is positive', async function (this: CentrifugeWorld) {
  const el = await this.currentPage.waitForXPath(tinlake('dashboardPage.totalFinancedToDateBox.value'))
  const value = await getTextContent(el)

  assert.ok(parseFloat(value.replace(/,/gi, '')) > 0)
})
