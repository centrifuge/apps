import { AddressOrPair } from '@polkadot/api/types'
import { ISubmittableResult } from '@polkadot/types/types'

export type TransactionOptions = {
  batch?: boolean
  paymentInfo?: AddressOrPair
  onStatusChange?: (result: ISubmittableResult) => void
}
