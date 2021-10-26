import { ApiPromise, WsProvider } from '@polkadot/api'
import { encodeAddress } from '@polkadot/util-crypto'

export function truncateAddress(address: string) {
  const encodedAddress = encodeAddress(address, 2)
  const first8 = encodedAddress.slice(0, 8)
  const last3 = encodedAddress.slice(-3)

  return `${first8}...${last3}`
}

const WSS_RPC_URL = 'wss://fullnode.centrifuge.io'
const wsProvider = new WsProvider(WSS_RPC_URL)

let apiPromise: Promise<ApiPromise>
let api: ApiPromise

export async function initPolkadotApi() {
  if (!apiPromise) {
    apiPromise = ApiPromise.create({ provider: wsProvider })
    apiPromise.then((obj) => (api = obj))
    return apiPromise
  }
  return api || apiPromise
}
