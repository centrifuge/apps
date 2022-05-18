import { encodeAddress } from '@polkadot/util-crypto'
import { map } from 'rxjs/operators'
import { CentrifugeBase } from '../CentrifugeBase'
import { Account } from '../types'

export function getProxiesModule(inst: CentrifugeBase) {
  function getUserProxies(args: [address: Account]) {
    const [address] = args

    const $query = inst.getSubqueryObservable<{
      proxies: { nodes: { id: string; delegator: string; delegatee: string; proxyType: string }[] }
    }>(
      `query($address: String!) {
        proxies(filter: { delegatee: { equalTo: $address }}) {
          nodes {
            id
            delegator
            delegatee
            proxyType
          }
        }
      }`,
      {
        address: encodeAddress(address, inst.getChainId()),
      },
      false
    )

    return $query.pipe(
      map((data) => {
        const proxies: Record<string, { delegator: string; types: string[] }> = {}
        data?.proxies.nodes.forEach((node) => {
          if (proxies[node.delegator]) {
            proxies[node.delegator].types.push(node.proxyType)
          } else {
            proxies[node.delegator] = {
              delegator: node.delegator,
              types: [node.proxyType],
            }
          }
        })
        return Object.values(proxies)
      })
    )
  }

  return {
    getUserProxies,
  }
}
