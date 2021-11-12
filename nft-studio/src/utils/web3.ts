import { ApiPromise, WsProvider } from '@polkadot/api'
import { encodeAddress } from '@polkadot/util-crypto'

export function truncateAddress(address: string) {
  const encodedAddress = encodeAddress(address)
  const first8 = encodedAddress.slice(0, 8)
  const last3 = encodedAddress.slice(-3)

  return `${first8}...${last3}`
}

// const WSS_RPC_URL = 'wss://fullnode.centrifuge.io'
const WSS_RPC_URL = 'ws://127.0.0.1:9954'
const wsProvider = new WsProvider(WSS_RPC_URL)

let apiPromise: Promise<ApiPromise>
let api: ApiPromise

export async function initPolkadotApi() {
  if (!apiPromise) {
    apiPromise = ApiPromise.create({
      provider: wsProvider,
      types: {
        ClassId: 'u64',
        InstanceId: 'u128',
      },
    })
    apiPromise.then((obj) => (api = obj))
    return apiPromise
  }
  return api || apiPromise
}
