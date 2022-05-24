import { encodeAddress } from '@polkadot/util-crypto'
import { CentrifugeBase } from '../CentrifugeBase'
import { Account } from '../types'
import * as utilsPure from '../utils'

export function getUtilsModule(inst: CentrifugeBase) {
  function formatAddress(address: Account) {
    return encodeAddress(address, inst.getChainId())
  }

  return {
    ...utilsPure,
    formatAddress,
  }
}
