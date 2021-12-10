import { ApiPromise, WsProvider } from '@polkadot/api'
import { RegistryTypes } from '@polkadot/types/types'

const cached: { [key: string]: Promise<ApiPromise> } = {}
export function getPolkadotApi(wsUrl: string, types?: RegistryTypes) {
  return (
    cached[wsUrl] ||
    (cached[wsUrl] = ApiPromise.create({
      provider: new WsProvider(wsUrl),
      types,
    }))
  )
}
