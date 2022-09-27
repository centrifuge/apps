import { ApiRx, WsProvider } from '@polkadot/api'
import { DefinitionRpc, DefinitionRpcSub } from '@polkadot/types/types'
import { Observable } from 'rxjs'

const cached: { [key: string]: Observable<ApiRx> } = {}
export function getPolkadotApi(
  wsUrl: string,
  types?: any,
  rpc?: Record<string, Record<string, DefinitionRpc | DefinitionRpcSub>>
) {
  return (
    cached[wsUrl] ||
    (cached[wsUrl] = ApiRx.create({
      provider: new WsProvider(wsUrl),
      // @ts-ignore
      types,
      rpc,
    }))
  )
}
