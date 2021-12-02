import { ApiPromise, WsProvider } from '@polkadot/api'

const cached: { [key: string]: Promise<ApiPromise> } = {}
export function getPolkadotApi(wsUrl: string, types: any) {
  return (
    cached[wsUrl] ||
    (cached[wsUrl] = ApiPromise.create({
      provider: new WsProvider(wsUrl),
      types,
    }))
  )
}
