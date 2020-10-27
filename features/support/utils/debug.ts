import { CentrifugeWorld } from '../world'

export async function debug(world: CentrifugeWorld) {
  await world.currentPage.evaluate(() => {
    debugger
  })
}
