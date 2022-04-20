import { ApiRx, WsProvider } from '@polkadot/api'
import { RegistryTypes } from '@polkadot/types/types'
import { Observable } from 'rxjs'

const cached: { [key: string]: Observable<ApiRx> } = {}
export function getPolkadotApi(wsUrl: string, types?: RegistryTypes) {
  return (
    cached[wsUrl] ||
    (cached[wsUrl] = ApiRx.create({
      provider: new WsProvider(wsUrl),
      types,
    }))
  )
}
