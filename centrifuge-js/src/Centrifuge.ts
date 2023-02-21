import { AddressOrPair } from '@polkadot/api/types'
import { Signer } from '@polkadot/types/types'
import { CentrifugeBase, UserProvidedConfig } from './CentrifugeBase'
import { getAuthModule } from './modules/auth'
import { getMetadataModule } from './modules/metadata'
import { getNftsModule } from './modules/nfts'
import { getPodModule } from './modules/pod'
import { getPoolsModule } from './modules/pools'
import { getProxiesModule } from './modules/proxies'
import { getTokensModule } from './modules/tokens'
import { getUtilsModule } from './modules/utils'

export class Centrifuge extends CentrifugeBase {
  nfts = getNftsModule(this)
  pools = getPoolsModule(this)
  utils = getUtilsModule(this)
  proxies = getProxiesModule(this)
  metadata = getMetadataModule(this)
  tokens = getTokensModule(this)
  pod = getPodModule()
  auth = getAuthModule(this)

  constructor(config: UserProvidedConfig = {}) {
    super(config)
  }

  connect(address: AddressOrPair, signer?: Signer) {
    return new Centrifuge({ ...this.config, signer, signingAddress: address })
  }
}
