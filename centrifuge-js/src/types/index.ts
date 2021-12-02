import { AddressOrPair } from '@polkadot/api/types'
import { ISubmittableResult } from '@polkadot/types/types'

export type TransactionOptions = {
  paymentInfo?: AddressOrPair
  onStatusChange?: (result: ISubmittableResult) => void
}
