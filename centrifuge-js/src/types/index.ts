import { AddressOrPair } from '@polkadot/api/types'
import { ISubmittableResult } from '@polkadot/types/types'
import { HexString } from '@polkadot/util/types'

export type TransactionOptions = {
  batch?: boolean
  paymentInfo?: AddressOrPair
  onStatusChange?: (result: ISubmittableResult) => void
}

export type Account = HexString | string | Uint8Array
