import { AddressOrPair } from '@polkadot/api/types'
import { ISubmittableResult } from '@polkadot/types/types'
import { HexString } from '@polkadot/util/types'
import BN from 'bn.js'

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
  transferToActingAccount?: BN
}

export type Account = HexString | string | Uint8Array

export type Multisig = {
  signers: string[]
  threshold: number
}

export type ComputedMultisig = Multisig & { address: string }
