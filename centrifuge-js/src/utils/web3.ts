import { ApiPromise, ApiRx, WsProvider } from '@polkadot/api'
import { RegistryTypes } from '@polkadot/types/types'
import { Observable } from 'rxjs'

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

const cachedRx: { [key: string]: Observable<ApiRx> } = {}
export function getPolkadotRxApi(wsUrl: string, types?: RegistryTypes) {
  return (
    cachedRx[wsUrl] ||
    (cachedRx[wsUrl] = ApiRx.create({
      provider: new WsProvider(wsUrl),
      types,
    }))
  )
}
