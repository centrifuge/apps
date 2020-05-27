const { Given, When, Then } = require("cucumber");
const { openPage, takeScreenshot } = require("./browser-actions");
const config = require("../config");
const increasedTimeout = {
  timeout: 5 * 60 * 1000,
};

Given("I am on the Gateway Page", increasedTimeout, async function () {
  return await openPage(this, config.gatewayUrl);
});

Given(
  "I am on the Tinlake investments page",
  increasedTimeout,
  async function () {
    return await openPage(this, config.tinlakeUrl);
  }
);

// Given('I am connected as admin', async function () {
//   await this.metamask.importAccount(config.ethAdminPrivateKey)
// });

// When("", increasedTimeout, async function () {
//   return;
// });

// Then("", increasedTimeout, async function () {
//   return;
// });
