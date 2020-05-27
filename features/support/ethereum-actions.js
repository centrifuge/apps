const dappeteer = require("dappeteer");
const config = require("../config");
const { CentrifugeWorld } = require("./world");

/**
 * @param {CentrifugeWorld} world
 */
export async function initMetamask(world) {
  world.metamask = await dappeteer.getMetamask(world.browser);

  await world.metamask.switchNetwork(config.network);
}
