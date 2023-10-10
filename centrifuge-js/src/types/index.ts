import {
  TransactionReceipt as EvmTransactionReceipt,
  TransactionResponse as EvmTransactionResponse,
} from '@ethersproject/providers'
import { AddressOrPair } from '@polkadot/api/types'
import { ISubmittableResult } from '@polkadot/types/types'
import { HexString } from '@polkadot/util/types'
import BN from 'bn.js'
import { Config } from '../CentrifugeBase'

type EvmTransactionResult = {
  response: EvmTransactionResponse
  receipt?: EvmTransactionReceipt
}

type TransactionResultBase = {
  data: ISubmittableResult | EvmTransactionResult
  events: ISubmittableResult['events']
  status: ISubmittableResult['status']['type']
  txHash: string
  blockNumber?: number
  error: any
}

export type TransactionPendingResult = TransactionResultBase & { error: null; blockNumber: undefined }
export type TransactionSuccessResult = TransactionResultBase & { error: null; blockNumber: number }
export type TransactionErrorResult = TransactionResultBase & { error: any; blockNumber: undefined }
export type TransactionResult = TransactionPendingResult | TransactionSuccessResult | TransactionErrorResult

export type TransactionOptions = {
  batch?: boolean
  signOnly?: boolean
  sendOnly?: boolean
  era?: number
  paymentInfo?: AddressOrPair
  onStatusChange?: (result: TransactionResult) => void
  createType?: 'immediate' | 'propose' | 'notePreimage'
  dryRun?: boolean
  proxies?: Config['proxies']
  multisig?: { signers: string[]; threshold: number }
  transferToActingAccount?: BN
}

export type Account = HexString | string | Uint8Array

export type Multisig = {
  signers: string[]
  threshold: number
}

export type ComputedMultisig = Multisig & { address: string }

export * from './subquery'
