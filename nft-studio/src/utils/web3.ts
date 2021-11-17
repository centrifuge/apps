import { ApiPromise, WsProvider } from '@polkadot/api'
import { addressEq, encodeAddress } from '@polkadot/util-crypto'

export function truncateAddress(address: string) {
  const encodedAddress = encodeAddress(address, 2)
  const first = encodedAddress.slice(0, 6)
  const last = encodedAddress.slice(-6)

  return `${first}...${last}`
}

export function isSameAddress(a?: string | Uint8Array, b?: string | Uint8Array) {
  if (!a || !b) return false
  if (a === b) return true
  return addressEq(a, b)
}

const apis: {
  [key in 'kusama' | 'altair']: {
    api?: ApiPromise
    apiPromise?: Promise<ApiPromise>
    provider: WsProvider
    types?: any
  }
} = {
  altair: {
    provider: new WsProvider(process.env.REACT_APP_ALTAIR_WSS_URL),
    types: {
      ClassId: 'u64',
      InstanceId: 'u128',
    },
  },
  kusama: {
    provider: new WsProvider(process.env.REACT_APP_KUSAMA_WSS_URL),
  },
}

export async function initPolkadotApi(network: keyof typeof apis = 'altair') {
  const obj = apis[network]
  if (!obj.apiPromise) {
    obj.apiPromise = ApiPromise.create({
      provider: obj.provider,
      types: obj.types,
    })
    obj.apiPromise.then((prom) => (obj.api = prom))
    return obj.apiPromise
  }
  return obj.api || obj.apiPromise
}
