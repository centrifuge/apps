import { Given, When, Then } from "cucumber"
import { openPage } from "./browser-actions"
import { config } from "../config"

Given("I am on the Gateway Page", async function () {
  return await openPage(this as any, config.gatewayUrl);
});

Given(
  "I am on the Tinlake investments page", async function () {
    return await openPage(this as any, config.tinlakeUrl);
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
