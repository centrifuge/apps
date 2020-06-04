import * as dappeteer from "dappeteer"
import { config } from "./config"
import { CentrifugeWorld } from "./world"

export async function initMetamask(world: CentrifugeWorld) {
  world.metamask = await dappeteer.getMetamask(world.browser);
}

export async function importAdminPK(world: CentrifugeWorld) {
  await world.metamask.importPK(config.ethAdminPrivateKey)
}

export async function importBorrowerPK(world: CentrifugeWorld) {
  await world.metamask.importPK(config.ethBorrowerPrivateKey)
}

export async function switchNetwork(world: CentrifugeWorld) {
  await world.metamask.switchNetwork(config.ethNetwork)
}

