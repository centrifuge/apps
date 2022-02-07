import { ApiPromise, WsProvider } from '@polkadot/api'
import { RegistryTypes } from '@polkadot/types/types'
import * as definitions from '../interfaces/definitions'

const cached: { [key: string]: Promise<ApiPromise> } = {}
export function getPolkadotApi(wsUrl: string, regTypes?: RegistryTypes) {
  const pdTypes = Object.values(definitions).reduce((res, { types }): object => ({ ...res, ...types }), {})

  return (
    cached[wsUrl] ||
    (cached[wsUrl] = ApiPromise.create({
      provider: new WsProvider(wsUrl),
      types: { ...pdTypes, ...regTypes },
    }))
  )
}
