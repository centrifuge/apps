import * as dappeteer from "dappeteer"
import { config } from "../config"
import { CentrifugeWorld } from "./world"

export async function initMetamask(world: CentrifugeWorld) {
  world.metamask = await dappeteer.getMetamask(world.browser);

  await world.metamask.switchNetwork(config.ethNetwork);
}
