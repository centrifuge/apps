// Copyright 2017-2022 Parity Technologies (UK) Ltd.
// This file is part of Substrate API Sidecar.
//
// Substrate API Sidecar is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

import { GenericCall, Struct } from '@polkadot/types'
import { Codec, Registry } from '@polkadot/types/types'

export interface ISanitizedCall {
  [key: string]: unknown
  method: string | IFrameMethod
  callIndex?: Uint8Array | string
  args: ISanitizedArgs
  hash: `0x${string}`
}

export interface ISanitizedArgs {
  call?: ISanitizedCall
  calls?: ISanitizedCall[]
  [key: string]: unknown
}

export interface IFrameMethod {
  pallet: string
  method: string
}

export function isFrameMethod(thing: unknown): thing is IFrameMethod {
  return typeof (thing as IFrameMethod).pallet === 'string' && typeof (thing as IFrameMethod).method === 'string'
}

/**
 * Helper function for `parseGenericCall`.
 *
 * @param argsArray array of `Codec` values
 * @param registry type registry of the block the call belongs to
 */
export function parseArrayGenericCalls(argsArray: Codec[], registry: Registry): (Codec | ISanitizedCall)[] {
  return argsArray.map((argument) => {
    if (argument instanceof GenericCall) {
      return parseGenericCall(argument as GenericCall, registry)
    }

    return argument
  })
}

/**
 * Recursively parse a `GenericCall` in order to label its arguments with
 * their param names and give a human friendly method name (opposed to just a
 * call index). Parses `GenericCall`s that are nested as arguments.
 *
 * @param genericCall `GenericCall`
 * @param registry type registry of the block the call belongs to
 */
export function parseGenericCall(genericCall: GenericCall, registry: Registry): ISanitizedCall {
  const newArgs: any = {}

  // Pull out the struct of arguments to this call
  const callArgs = genericCall.get('args') as Struct

  // Make sure callArgs exists and we can access its keys
  if (callArgs && callArgs.defKeys) {
    // paramName is a string
    for (const paramName of callArgs.defKeys) {
      const argument = callArgs.get(paramName)

      if (Array.isArray(argument)) {
        newArgs[paramName] = parseArrayGenericCalls(argument, registry)
      } else if (argument instanceof GenericCall) {
        newArgs['callData'] = argument.toHex()
        newArgs[paramName] = parseGenericCall(argument as GenericCall, registry)
      } else if (
        argument &&
        paramName === 'call' &&
        ['Bytes', 'WrapperKeepOpaque<Call>', 'WrapperOpaque<Call>'].includes(argument?.toRawType())
      ) {
        // multiSig.asMulti.args.call is either an OpaqueCall (Vec<u8>),
        // WrapperKeepOpaque<Call>, or WrapperOpaque<Call> that we
        // serialize to a polkadot-js Call and parse so it is not a hex blob.
        try {
          const call = registry.createType('Call', argument.toHex())
          newArgs[paramName] = parseGenericCall(call, registry)
        } catch {
          newArgs[paramName] = argument
        }
      } else {
        newArgs[paramName] = argument
      }
    }
  }

  return {
    method: {
      pallet: genericCall.section,
      method: genericCall.method,
    },
    args: newArgs,
    hash: genericCall.hash.toHex(),
  }
}
