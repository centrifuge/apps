import first from 'it-first'
import * as lp from 'it-length-prefixed'
import map from 'it-map'
import { pipe } from 'it-pipe'

import { DataProtocolRequest, DataProtocolResponse } from './data_protocol.v1.js'

// Should be accessible without lazy loading
// export async function hashDocument(properties: object) {
//   const encoder = new TextEncoder()
//   const data = encoder.encode(JSON.stringify(properties))
//   const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', data)
//   const hashArray = Array.from(new Uint8Array(hashBuffer))
//   const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
//   return `0x${hashHex}`
// }

export function toHex(buffer: Uint8Array) {
  return `0x${Array.from(buffer)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')}`
}

export async function send(connection: any, message: DataProtocolRequest, _: { signal?: AbortSignal } = {}) {
  const stream = await connection.newStream('/centrifuge-data-extension/1')
  try {
    const buffer = DataProtocolRequest.encode(message).finish()
    const msg = await pipe(
      [buffer],
      (source) => lp.encode(source),
      stream,
      (source) => lp.decode(source),
      (source) => map(source, (buf) => DataProtocolResponse.decode(buf.subarray())),
      async (source) => first(source)
    )
    console.log('response', msg)
    if (!msg) return
    const decoder = new TextDecoder()
    try {
      if (msg.createDocumentResponse?.payload) {
        const res = JSON.parse(decoder.decode(msg.createDocumentResponse.payload))
        console.log('res', res)
        return res
      }
      if (msg.getDocumentResponse?.payload) {
        const res = JSON.parse(decoder.decode(msg.getDocumentResponse.payload))
        console.log('res', res)
        return res
      }
    } catch (e) {
      console.error('error in response', e)
      throw e
    }
  } catch (err: any) {
    console.error('error while calling %p', connection.remotePeer, err)

    stream.abort(err)

    throw err
  } finally {
    // options.signal?.removeEventListener('abort', onAbort)
    console.log('close stream')
    await stream.close()
  }
}
