import { AddressOrPair } from '@polkadot/api/types'
import { ISubmittableResult } from '@polkadot/types/types'
import { HexString } from '@polkadot/util/types'

export type TransactionOptions = {
  batch?: boolean
  signOnly?: boolean
  sendOnly?: boolean
  era?: number
  paymentInfo?: AddressOrPair
  onStatusChange?: (result: ISubmittableResult) => void
  createType?: 'immediate' | 'propose' | 'notePreimage'
  dryRun?: boolean
  proxy?: string | string[]
  multisig?: { signers: string[]; threshold: number }
}

export type Account = HexString | string | Uint8Array
