import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'
import { keys } from '@libp2p/crypto'
import { identify } from '@libp2p/identify'
import { Connection, PeerId, PrivateKey } from '@libp2p/interface'
import { kadDHT, removePrivateAddressesMapper } from '@libp2p/kad-dht'
import { peerIdFromKeys, peerIdFromString } from '@libp2p/peer-id'
import { ping } from '@libp2p/ping'
import { webSockets } from '@libp2p/websockets'
import * as websocketsFilter from '@libp2p/websockets/filters'
import { multiaddr } from '@multiformats/multiaddr'
import { Libp2p, createLibp2p } from 'libp2p'
import { CreateDocumentRequest, DataProtocolRequest, GetDocumentRequest } from './data_protocol.v1'
import { send, toHex } from './utils'

const BOOT_NODE_MULTIADDR = '/ip4/34.107.30.188/tcp/30333/ws/p2p/12D3KooWRkjCku7DDyGhqaQV9j9ZGjhSAZWpg9YC9VfLrpEFN5no'
// const DATA_NODE_PEER_ID = '12D3KooWDnScZfemMmJ5efz9ZkYZ7kW6d8Ezi62ADy57N2VFLUtD'
const KADEMLIA_PROTOCOL = '/sup/kad'

export type Libp2pPrivateKey = PrivateKey

export class DataProtocolSession {
  ready
  private node!: Libp2p
  private peerId!: PeerId
  private connections = new Map<string, Connection>()

  static generatePrivateKey(): Promise<PrivateKey> {
    return keys.generateKeyPair('Ed25519')
  }

  static unmarshalPrivateKey(encryptedKey: string, password = ''): Promise<PrivateKey> {
    return keys.importKey(encryptedKey, password)
  }

  get publicKeyHex() {
    return toHex(this.privateKey.public.marshal())
  }

  constructor(public privateKey: PrivateKey) {
    this.ready = this.init().then(() => {
      console.log('DataProtocolSession ready')
    })
  }

  async init() {
    if (this.node) {
      this.node.start()
      return
    }
    this.peerId = await peerIdFromKeys(this.privateKey.public.bytes, this.privateKey.bytes)

    this.node = await createLibp2p({
      peerId: this.peerId,
      transports: [
        webSockets({
          filter: websocketsFilter.all,
        }),
      ],
      connectionEncryption: [noise()],
      streamMuxers: [yamux()],
      services: {
        ping: ping(),
        identify: identify(),
        dht: kadDHT({
          kBucketSize: 100,
          protocol: KADEMLIA_PROTOCOL,
          clientMode: true,
          peerInfoMapper: removePrivateAddressesMapper,
        }),
      },
    })
    const ma = multiaddr(BOOT_NODE_MULTIADDR)
    await this.node.dialProtocol(ma, KADEMLIA_PROTOCOL)
  }

  async connectToPeer(peerId: string): Promise<Connection> {
    await this.ready

    if (this.connections.has(peerId)) {
      const connection = this.connections.get(peerId)!
      if (connection.status === 'open') {
        return connection
      }
    }

    const { node } = this

    const peer = peerIdFromString(peerId)

    const peerInfo = await node.peerRouting.findPeer(peer)
    console.log('peerInfo.id', peerInfo.id, peerInfo)

    console.log(
      'multiaddress',
      // @ts-expect-error
      await node.components.connectionManager.dialQueue.calculateMultiaddrs(peerInfo.id)
    )

    console.log('node', node)

    console.log(
      'peer addresses',
      peerInfo.multiaddrs.map((addr) => addr.toString())
    )

    // const connection = await node.dial(peerInfo.id)
    // const connection = await node.dial(peer)
    // const connection = await node.dial(peerInfo.id)
    // const connection = await node.dial(
    //   (await node.components.connectionManager.dialQueue.calculateMultiaddrs(peerInfo.id)).map((e) => e.multiaddr)
    // )
    const connection = await Promise.any(peerInfo.multiaddrs.map((addr) => node.dial(addr)))

    this.connections.set(peerId, connection)

    return connection
  }

  async storeDocumentAtPeer(peerId: string, documentId: number, documentVersion: number, properties: object) {
    const connection = await this.connectToPeer(peerId)

    const encoder = new TextEncoder()
    const data = encoder.encode(JSON.stringify(properties))
    const message = DataProtocolRequest.create({
      createDocumentRequest: CreateDocumentRequest.create({
        payload: encoder.encode(
          JSON.stringify({
            id: documentId,
            version: documentVersion,
            pool_id: 10,
            loan_id: 11,
            users: [],
            data: Array.from(data),
          })
        ),
      }),
    })
    const res = await send(connection, message)
    console.log('store doc res', res, documentId, documentVersion)
  }

  async requestDocumentFromPeer(peerId: string, documentId: number, documentVersion: number) {
    console.log('requestDocumentFromPeer', peerId, documentId, documentVersion)
    const connection = await this.connectToPeer(peerId)

    const encoder = new TextEncoder()
    const message = DataProtocolRequest.create({
      getDocumentRequest: GetDocumentRequest.create({
        documentId: encoder.encode(String(documentId)),
        documentVersion,
      }),
    })
    const res = await send(connection, message)
    return res
  }

  async stop() {
    await this.node.stop()
  }
}
