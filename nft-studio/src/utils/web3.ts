import { ApiPromise, WsProvider } from '@polkadot/api'
import { addressEq, encodeAddress } from '@polkadot/util-crypto'

export function truncateAddress(address: string) {
  const encodedAddress = encodeAddress(address, 2)
  const first8 = encodedAddress.slice(0, 8)
  const last3 = encodedAddress.slice(-3)

  return `${first8}...${last3}`
}

export function isSameAddress(a?: string | Uint8Array, b?: string | Uint8Array) {
  if (!a || !b) return false
  if (a === b) return true
  return addressEq(a, b)
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
