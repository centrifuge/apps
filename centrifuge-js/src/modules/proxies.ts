import { encodeAddress } from '@polkadot/util-crypto'
import { map, switchMap } from 'rxjs/operators'
import { CentrifugeBase } from '../CentrifugeBase'
import { Account } from '../types'

export function getProxiesModule(inst: CentrifugeBase) {
  function getUserProxies(args: [address: Account]) {
    const [address] = args

    return inst.getApi().pipe(
      switchMap((api) => {
        return inst.getSubqueryObservable<{
          proxies: { nodes: { delegator: string; proxyType: string }[] }
        }>(
          `query($address: String!) {
          proxies(filter: { delegatee: { equalTo: $address }}) {
            nodes {
              delegator
              proxyType
            }
          }
        }`,
          {
            address: encodeAddress(address, api.registry.chainSS58),
          },
          false
        )
      }),
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

  function getMultiUserProxies(args: [addresses: Account[]]) {
    const [addresses] = args

    return inst.getApi().pipe(
      switchMap((api) => {
        return inst.getSubqueryObservable<{
          proxies: { nodes: { id: string; delegator: string; delegatee: string; proxyType: string }[] }
        }>(
          `query($addresses: [String!]) {
            proxies(filter: { delegatee: { in: $addresses }}) {
              nodes {
                id
                delegator
                delegatee
                proxyType
              }
            }
          }`,
          {
            addresses: addresses.map((addr) => encodeAddress(addr, api.registry.chainSS58)),
          },
          false
        )
      }),
      map((data) => {
        const proxiesByUser: Record<string, { delegator: string; types: string[] }[]> = {}
        data?.proxies.nodes.forEach((node) => {
          const index = proxiesByUser[node.delegatee]?.findIndex((p) => p.delegator === node.delegator)
          if (index > -1) {
            proxiesByUser[node.delegatee][index].types.push(node.proxyType)
          } else {
            ;(proxiesByUser[node.delegatee] || (proxiesByUser[node.delegatee] = [])).push({
              delegator: node.delegator,
              types: [node.proxyType],
            })
          }
        })
        return proxiesByUser
      })
    )
  }

  return {
    getUserProxies,
    getMultiUserProxies,
  }
}
