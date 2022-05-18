import { AddressOrPair } from '@polkadot/api/types'
import { Signer } from '@polkadot/types/types'
import { CentrifugeBase, UserProvidedConfig } from './CentrifugeBase'
import { getNftsModule } from './modules/nfts'
import { getPoolsModule } from './modules/pools'
import { getProxiesModule } from './modules/proxies'
import { getUtilsModule } from './modules/utils'

export class Centrifuge extends CentrifugeBase {
  nfts = getNftsModule(this)
  pools = getPoolsModule(this)
  utils = getUtilsModule()
  proxies = getProxiesModule(this)

  constructor(config: UserProvidedConfig = {}) {
    super(config)
  }

  connect(address: AddressOrPair, signer?: Signer) {
    return new Centrifuge({ ...this.config, signer, signingAddress: address })
  }
}
