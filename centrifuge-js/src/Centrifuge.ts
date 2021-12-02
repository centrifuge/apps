import { AddressOrPair } from '@polkadot/api/types'
import { Signer } from '@polkadot/types/types'
import { CentrifugeBase } from './CentrifugeBase'
import { WithNfts } from './modules/nfts'

export class Centrifuge extends WithNfts(CentrifugeBase) {
  connect(address: AddressOrPair, signer?: Signer) {
    return new Centrifuge({ ...this.config, signer, signingAddress: address })
  }
}
