import type { Libp2pPrivateKey } from '@centrifuge/libp2p-test'
import { filter, map, repeatWhen, switchMap } from 'rxjs'
import { Centrifuge } from '../Centrifuge'
import { TransactionOptions } from '../types'

export function getDataProtocolModule(inst: Centrifuge) {
  async function hashDocument(properties: object) {
    const encoder = new TextEncoder()
    const data = encoder.encode(JSON.stringify(properties))
    // eslint-disable-next-line no-undef
    const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
    return `0x${hashHex}`
  }

  function getModule() {
    return import('@centrifuge/libp2p-test')
  }

  async function createSession(possiblyPrivateKey?: Libp2pPrivateKey | { key: string; password?: string }) {
    const { DataProtocolSession } = await getModule()
    let privateKey
    if (!possiblyPrivateKey) {
      privateKey = await DataProtocolSession.generatePrivateKey()
    } else if ('key' in possiblyPrivateKey) {
      privateKey = await DataProtocolSession.unmarshalPrivateKey(possiblyPrivateKey.key, possiblyPrivateKey.password)
    } else {
      privateKey = possiblyPrivateKey
    }
    const session = new DataProtocolSession(privateKey)
    await session.ready
    return session
  }

  // Use the current keystore pallet as a placeholder
  function getKeys(args: [address: string]) {
    const [address] = args
    const $api = inst.getApi()
    const $events = inst.getEvents().pipe(
      filter(({ api, events }) => {
        const event = events.find(({ event }) => api.events.keystore.KeyAdded.is(event))
        return !!event
      })
    )

    return $api.pipe(
      switchMap((api) => api.query.keystore.keys.entries(address)),
      map((data) => {
        console.log('data', data)
        return data.flatMap(([keyValue, dataValue]) => {
          const key = (keyValue as any).toHuman()[1][0]
          const data = (dataValue as any).toHuman()
          if (data.revokedAt) {
            return []
          }
          return key as string
        })
      }),
      repeatWhen(() => $events)
    )
  }

  function addKey(args: [key: string], options?: TransactionOptions) {
    const [key] = args
    const $api = inst.getApi()
    return $api.pipe(
      switchMap((api) => inst.wrapSignAndSend(api, api.tx.keystore.addKeys([[key, 'P2PDiscovery', 'ECDSA']]), options))
    )
  }

  return {
    hashDocument,
    createSession,
    getKeys,
    addKey,
  }
}
