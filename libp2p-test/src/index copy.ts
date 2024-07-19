import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'
import { identify } from '@libp2p/identify'
import { kadDHT, removePrivateAddressesMapper } from '@libp2p/kad-dht'
import { peerIdFromKeys, peerIdFromString } from '@libp2p/peer-id'
import { ping } from '@libp2p/ping'
import { tcp } from '@libp2p/tcp'
import { webSockets } from '@libp2p/websockets'
import * as websocketsFilter from '@libp2p/websockets/filters'
import { multiaddr } from '@multiformats/multiaddr'
import first from 'it-first'
import * as lp from 'it-length-prefixed'
import map from 'it-map'
import { pipe } from 'it-pipe'
import { createLibp2p } from 'libp2p'
// import path from "path";
import { pushable } from 'it-pushable'
// import path from "path";
// import { fileURLToPath } from "url";

import {
  BeepRequest,
  CreateDocumentRequest,
  DataProtocolRequest,
  DataProtocolResponse,
  GetDocumentRequest,
} from './data_protocol.v1.js'

// import { fileURLToPath } from "url";
// Cosmin: 12D3KooWDnScZfemMmJ5efz9ZkYZ7kW6d8Ezi62ADy57N2VFLUtD
// JP:     12D3KooWCWV4hXqS28dB7ybxDTAn78MsQmPMfTGi6aTGqffMhfFs

const privateKeyHex =
  '08011240eeea72dfbb24f56a520e938e5998fea348d30d68917697d3f38d52472b9d23d427fe673e89ba79f6689320f436aa19e3f8a61db012a865a26d0ddd59154d5c76'
const publicKeyHex = '0801122027fe673e89ba79f6689320f436aa19e3f8a61db012a865a26d0ddd59154d5c76'

const privateKey = hexToUint8Array(privateKeyHex)
const publicKey = hexToUint8Array(publicKeyHex)

async function run() {
  const peerId = await peerIdFromKeys(publicKey, privateKey)

  const node = await createLibp2p({
    peerId,
    transports: [
      webSockets({
        filter: websocketsFilter.all,
      }),
      tcp(),
    ],
    connectionEncryption: [noise()],
    streamMuxers: [yamux()],
    services: {
      ping: ping(),
      identify: identify(),
      dht: kadDHT({
        kBucketSize: 100,
        protocol: '/centrifuge/kad',
        clientMode: true,
        peerInfoMapper: removePrivateAddressesMapper,
      }),
    },
  })

  await node.start()

  node.addEventListener('peer:connect', (event) => {
    // console.log('peer connect', event.detail.toString())
  })
  node.addEventListener('peer:disconnect', (event) => {
    // console.log('peer disconnect', event.detail.toString())
  })
  node.addEventListener('connection:close', (event) => {
    // console.log('connection close', event.detail.id, node.getConnections().length)
  })
  node.addEventListener('connection:open', (event) => {
    // console.log('connection open', event.detail.id, node.getConnections().length)
  })

  const ma = multiaddr('/ip4/34.159.117.205/tcp/30333/ws/p2p/12D3KooWMspZo4aMEXWBH4UXm3gfiVkeu1AE68Y2JDdVzU723QPc')

  await node.dialProtocol(ma, '/centrifuge/kad')

  console.log('protocol dialed')

  const cosminPeerId = peerIdFromString('12D3KooWDnScZfemMmJ5efz9ZkYZ7kW6d8Ezi62ADy57N2VFLUtD')

  const peerInfo = await node.peerRouting.findPeer(cosminPeerId)
  console.log('peerInfo.id', peerInfo.id, peerInfo)

  console.log(
    'components.connectionManager.getDialQueue()',
    await node.components.connectionManager.dialQueue.calculateMultiaddrs(peerInfo.id)
  )

  console.log('node', node)

  console.log(
    'peer addresses',
    peerInfo.multiaddrs.map((addr) => addr.toString())
  )

  // const connection = await node.dial(peerInfo.id)
  // const connection = await node.dial(cosminPeerId)
  // const connection = await node.dial(peerInfo.id)
  // const connection = await node.dial(
  //   (await node.components.connectionManager.dialQueue.calculateMultiaddrs(peerInfo.id)).map((e) => e.multiaddr)
  // )
  const connection = await Promise.any(peerInfo.multiaddrs.map((addr) => node.dial(addr)))
  const stream = await connection.newStream('/centrifuge-data-extension/1')
  // const stream = await node.dialProtocol(peerInfo.multiaddrs[1], '/centrifuge-data-extension/1')
  // const stream = await Promise.any(
  //   peerInfo.multiaddrs.map((addr) => node.dialProtocol(addr, '/centrifuge-data-extension/1'))
  // )

  console.log('stream', stream)

  // const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
  // const __dirname = path.dirname(__filename); // get the name of the directory

  // const filePath = path.join(__dirname, "data_protocol.v1.proto");

  // const root = await protobuf.load(filePath);

  // const DataProtocolRequest = root.lookupType(
  //   "api.v1.data_protocol.DataProtocolRequest"
  // );

  // const BeepRequest = root.lookupType("api.v1.data_protocol.BeepRequest");
  // const CreateDocumentRequest = root.lookupType(
  //   "api.v1.data_protocol.CreateDocumentRequest"
  // );

  // const DataProtocolResponse = root.lookupType(
  //   "api.v1.data_protocol.DataProtocolResponse"
  // );

  // pub struct DataProtocolDocument {
  // 	pub id: u128,
  // 	pub version: u64,
  // 	pub pool_id: u64,
  // 	pub loan_id: u64,
  // 	pub users: Vec<User>,
  // 	pub data: Vec<u8>,
  // }

  const message = DataProtocolRequest.create({
    beepRequest: BeepRequest.create(),
  })

  const encoder = new TextEncoder()
  const message2 = DataProtocolRequest.create({
    createDocumentRequest: CreateDocumentRequest.create({
      payload: encoder.encode(
        JSON.stringify({
          id: Math.round(Math.random() * 1000000),
          version: 9,
          pool_id: 10,
          loan_id: 11,
          users: [],
          data: [],
        })
      ),
    }),
  })

  const message3 = DataProtocolRequest.create({
    getDocumentRequest: GetDocumentRequest.create({
      documentId: encoder.encode('10'),
      documentVersion: 9,
    }),
  })

  // const buffer = DataProtocolRequest.encode(payload).finish();

  const buffer = DataProtocolRequest.encode(message).finish()
  const buffer2 = DataProtocolRequest.encode(message2).finish()
  const buffer3 = DataProtocolRequest.encode(message3).finish()

  const outgoing = pushable()

  setTimeout(async () => {
    console.log('push1', buffer)
    outgoing.push(buffer)
    // send(connection, message)
  }, 1000)

  setTimeout(() => {
    console.log('push2', buffer2)
    outgoing.push(buffer2)
    // send(connection, message2)
  }, 2000)

  setTimeout(async () => {
    console.log('push3', buffer3)
    // outgoing.push(buffer3)
    try {
      await send(connection, message)
    } catch (e) {
      console.error('fail', e)
    }
  }, 3000)

  // write
  // pipe([buffer], (source) => lp.encode(source), stream.sink)

  // read
  pipe(
    outgoing,
    (source) => lp.encode(source),
    stream,
    (source) => lp.decode(source),
    (source) => map(source, (buf) => DataProtocolResponse.decode(buf.subarray())),
    async (source) => {
      for await (const msg of source) {
        console.log('response')
        console.log(msg)
        const decoder = new TextDecoder()
        if (msg.createDocumentResponse?.payload) {
          try {
            console.log(JSON.parse(decoder.decode(msg.createDocumentResponse.payload)))
          } catch (e) {
            console.error(e)
          }
        }
        if (msg.getDocumentResponse?.payload) {
          try {
            console.log(JSON.parse(decoder.decode(msg.getDocumentResponse.payload)))
          } catch (e) {
            console.error(e)
          }
        }
      }
    }
  )

  node.addEventListener
}

async function send(connection: any, message: DataProtocolRequest) {
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
    if (!msg) return
    console.log('response')
    console.log(msg)
    const decoder = new TextDecoder()
    if (msg.createDocumentResponse?.payload) {
      try {
        console.log(JSON.parse(decoder.decode(msg.createDocumentResponse.payload)))
      } catch (e) {
        console.error(e)
      }
    }
    if (msg.getDocumentResponse?.payload) {
      try {
        console.log(JSON.parse(decoder.decode(msg.getDocumentResponse.payload)))
      } catch (e) {
        console.error(e)
      }
    }
  } catch (err: any) {
    console.error('error while pinging %p', connection.remotePeer, err)

    stream.abort(err)

    throw err
  } finally {
    // options.signal?.removeEventListener('abort', onAbort)
    console.log('close steam')
    await stream.close()
  }
}

run()

function hexToUint8Array(hexStr: string): Uint8Array {
  if (hexStr.length % 2 !== 0) {
    throw new Error('Invalid hex string length.')
  }

  const result = new Uint8Array(hexStr.length / 2)

  for (let i = 0, j = 0; i < hexStr.length; i += 2, j++) {
    result[j] = parseInt(hexStr.slice(i, i + 2), 16)
  }

  return result
}
