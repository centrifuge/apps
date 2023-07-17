import { GenericCall } from '@polkadot/types'
import { AnyJson } from '@polkadot/types/types'
import { u8aToHex } from '@polkadot/util'
import { createKeyMulti, sortAddresses } from '@polkadot/util-crypto'
import { combineLatest, of } from 'rxjs'
import { combineLatestWith, filter, map, repeatWhen, switchMap, take } from 'rxjs/operators'
import { CentrifugeBase } from '../CentrifugeBase'
import { TransactionOptions } from '../types'
import { addressToHex, isSameAddress } from '../utils'
import { ISanitizedCall, parseGenericCall } from '../utils/parseCall'

export type PendingMultisigInfo = {
  approvals: string[]
  deposit: number
  depositor: string
  when: { height: number; index: number }
}

export type PendingMultisigData = {
  callData?: `0x${string}`
  hash: string
  name: string
  call?: GenericCall
  args?: AnyJson
  info: PendingMultisigInfo
}

function computeMultisigInfo(
  c: ISanitizedCall,
  hash: string,
  registry: any,
  info: PendingMultisigInfo
): PendingMultisigData | null {
  let result: Pick<PendingMultisigData, 'name' | 'callData'> | null = null

  function getCallResult(c: ISanitizedCall) {
    if (typeof c.method !== 'string' && c.method.pallet === 'multisig') {
      if (c.method.method === 'asMulti' && typeof c.args.call?.method !== 'string') {
        if (c.args.call?.hash === hash) {
          result = {
            name: `${c.args.call?.method?.pallet}.${c.args.call?.method.method}`,
            callData: c.args.callData as PendingMultisigData['callData'],
          }
        }
      } else {
        const foundHash = (c.args?.call_hash as Uint8Array).toString()
        if (foundHash === hash) {
          result = {
            name: 'Unknown call',
            callData: undefined,
          }
        }
      }
      // this is not a multisig call
      // try to dig deeper
    } else {
      if (c.args.calls) {
        for (const call of c.args.calls) {
          getCallResult(call)
        }
      } else if (c.args.call) {
        getCallResult(c.args.call)
      }
    }
  }

  getCallResult(c)
  if (!result) return null

  const { name, callData } = result

  const call = !!callData && !!hash && registry.createType('Call', callData)

  return {
    callData,
    hash,
    name,
    call,
    args: call && call.toHuman().args,
    info,
  }
}

export function getMultisigModule(inst: CentrifugeBase) {
  function getPendingTransaction(args: [multiAddress: string, hash: string]) {
    const [multiAddress, hash] = args

    return inst.getApi().pipe(
      switchMap((api) => api.query.multisig.multisigs(multiAddress, hash)),
      switchMap((pending) => {
        const info = pending.toJSON() as unknown as PendingMultisigInfo
        return inst.getBlockByBlockNumber(info.when.height).pipe(
          map((signedBlock) => {
            const ext = signedBlock.block.extrinsics[info.when.index]
            const decoded = parseGenericCall(ext.method as GenericCall, ext.registry)
            return computeMultisigInfo(decoded, hash, ext.registry, {
              ...info,
              approvals: info.approvals.map((addr) => addressToHex(addr)),
              depositor: addressToHex(info.depositor),
            })
          })
        )
      })
    )
  }

  function getPendingTransactions(args: [multiAddress: string]) {
    const [multiAddress] = args

    const $events = inst.getEvents().pipe(
      filter(({ api, events }) => {
        const event = events.find(
          ({ event }) =>
            api.events.multisig.MultisigApproval.is(event) ||
            api.events.multisig.MultisigCancelled.is(event) ||
            api.events.multisig.MultisigExecuted.is(event) ||
            api.events.multisig.NewMultisig.is(event)
        )

        if (!event) return false
        const { multisig: eventAddress } = (event.toHuman() as any).event.data
        return isSameAddress(eventAddress, multiAddress)
      })
    )

    return inst.getApi().pipe(
      switchMap((api) => api.query.multisig.multisigs.entries(multiAddress)),
      switchMap((pendingData) => {
        const pending = pendingData.map(([key, data]) => ({
          hash: (key.toHuman() as Array<string>)[1],
          info: data.toJSON() as unknown as PendingMultisigInfo,
        }))
        // add in an empty observable so `combineLatest` always emits, even when `pending` is an empty array
        return combineLatest([of(null), ...pending.map((p) => inst.getBlockByBlockNumber(p.info.when.height))]).pipe(
          map(([, ...signedBlocks]) => {
            return signedBlocks
              .map((signedBlock, i) => {
                const { info, hash } = pending[i]
                const ext = signedBlock.block.extrinsics[info.when.index]
                const decoded = parseGenericCall(ext.method as GenericCall, ext.registry)
                return computeMultisigInfo(decoded, hash, ext.registry, {
                  ...info,
                  approvals: info.approvals.map((addr) => addressToHex(addr)),
                  depositor: addressToHex(info.depositor),
                })
              })
              .filter(Boolean) as PendingMultisigData[]
          })
        )
      }),
      repeatWhen(() => $events)
    )
  }

  function approveOrCancel(
    args: [
      hash: string,
      multisig: { signers: string[]; threshold: number },
      calldataIfNeeded?: string,
      cancel?: boolean
    ],
    options?: TransactionOptions
  ) {
    const [hash, { signers, threshold }, calldataIfNeeded, cancel] = args
    const $api = inst.getApi()

    const address = u8aToHex(createKeyMulti(signers, threshold))

    const otherSigners = sortAddresses(
      signers.filter((signer) => !isSameAddress(signer, inst.getSignerAddress('substrate')))
    )

    return $api.pipe(
      combineLatestWith(getPendingTransaction([address, hash]).pipe(take(1))),
      switchMap(([api, pendingMultisig]) => {
        if (!pendingMultisig) throw new Error('No pending multisig transaction found')
        const canSubmit = pendingMultisig.info.approvals.length === threshold - 1

        let $paymentInfo = of({})
        const callData = pendingMultisig.callData || calldataIfNeeded
        if (!cancel && canSubmit) {
          if (!callData) throw new Error('Calldata required to submit multicall approval')
          const call: GenericCall = api.createType('Call', callData) as any
          if (call.hash.toHex() !== pendingMultisig.hash) {
            throw new Error(
              `The provided hash for the pending multisig transaction does not match the one of the calldata. Provided hash: ${call.hash.toHex()}, computed hash: ${
                pendingMultisig.hash
              }`
            )
          }
          $paymentInfo = api.tx(call).paymentInfo(inst.getSignerAddress('substrate'))
        }

        return $paymentInfo.pipe(
          switchMap((callInfo: any) => {
            let submittable
            if (cancel) {
              submittable = api.tx.multisig.cancelAsMulti(
                threshold,
                otherSigners,
                pendingMultisig.info.when,
                pendingMultisig.hash
              )
            } else if (canSubmit && callInfo.weight) {
              submittable = api.tx.multisig.asMulti(
                threshold,
                otherSigners,
                pendingMultisig.info.when,
                callData,
                callInfo.weight
              )
              // if we can't submit yet (more signatures required), all we need is the call hash
            } else if (!canSubmit) {
              submittable = api.tx.multisig.approveAsMulti(
                threshold,
                otherSigners,
                pendingMultisig.info.when,
                pendingMultisig.hash,
                0
              )
            } else {
              throw new Error('Not enough data to submit the multicall approval')
            }
            return inst.wrapSignAndSend(api, submittable, { ...options, multisig: undefined, proxy: undefined })
          })
        )
      })
    )
  }

  return {
    getPendingTransaction,
    getPendingTransactions,
    approveOrCancel,
  }
}
