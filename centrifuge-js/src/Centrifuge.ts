import { AddressOrPair } from '@polkadot/api/types'
// import { firstValueFrom, switchMap } from 'rxjs'
import { Signer } from '@polkadot/types/types'
import { CentrifugeBase, UserProvidedConfig } from './CentrifugeBase'
// import { getNftsModule__DEPRECATED } from './modules/deprecated'
import { getNftsModule } from './modules/nfts'
import { getPoolsModule } from './modules/pools'
import { getProxiesModule } from './modules/proxies'
import { getUtilsModule } from './modules/utils'

export class Centrifuge extends CentrifugeBase {
  nfts = getNftsModule(this)
  pools = getPoolsModule(this)
  utils = getUtilsModule(this)
  proxies = getProxiesModule(this)

  constructor(config: UserProvidedConfig = {}) {
    super(config)
  }

  // get nfts() {
  //   (async () => {
  //     try {
  //       const $api = this.getApi();
  //       const rawSpecs = await firstValueFrom($api.pipe(switchMap((api) => api.query.system.lastRuntimeUpgrade())))
  //       const specs = rawSpecs.toHuman()
  //       const version = parseFloat(specs.specVersion.replaceAll(",", ''))
  //       if (version < 1007) {
  //         console.log('omg made it', specs)
  //         return getNftsModule__DEPRECATED(this)
  //       }
  //       return getNftsModule(this)
  //     } catch (e) {
  //       return 0;  // fallback value
  //     }
  //   })()
  //   return getNftsModule(this)
  // }

  connect(address: AddressOrPair, signer?: Signer) {
    return new Centrifuge({ ...this.config, signer, signingAddress: address })
  }
}
