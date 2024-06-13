import type { Signer as EvmSigner } from '@ethersproject/abstract-signer'
import { AddressOrPair } from '@polkadot/api/types'
import { Signer } from '@polkadot/types/types'
import { CentrifugeBase, UserProvidedConfig } from './CentrifugeBase'
import { getAuthModule } from './modules/auth'
import { getLiquidityPoolsModule } from './modules/liquidityPools'
import { getMetadataModule } from './modules/metadata'
import { getMultisigModule } from './modules/multisig'
import { getNftsModule } from './modules/nfts'
import { getPoolsModule } from './modules/pools'
import { getProxiesModule } from './modules/proxies'
import { getRemarkModule } from './modules/remark'
import { getRewardsModule } from './modules/rewards'
import { getTinlakeModule } from './modules/tinlake'
import { getTokensModule } from './modules/tokens'
import { getUtilsModule } from './modules/utils'

export class Centrifuge extends CentrifugeBase {
  nfts = getNftsModule(this)
  pools = getPoolsModule(this)
  liquidityPools = getLiquidityPoolsModule(this)
  utils = getUtilsModule(this)
  proxies = getProxiesModule(this)
  metadata = getMetadataModule(this)
  tokens = getTokensModule(this)
  auth = getAuthModule(this)
  tinlake = getTinlakeModule(this)
  multisig = getMultisigModule(this)
  remark = getRemarkModule(this)
  rewards = getRewardsModule(this)

  constructor(config: UserProvidedConfig = {}) {
    super(config)
  }

  connect(address: AddressOrPair, signer?: Signer) {
    return new Centrifuge({ ...this.config, signer, signingAddress: address })
  }

  connectEvm(address: string, signer?: EvmSigner, substrateEvmChainId?: number) {
    return new Centrifuge({ ...this.config, evmSigner: signer, evmSigningAddress: address, substrateEvmChainId })
  }
}
