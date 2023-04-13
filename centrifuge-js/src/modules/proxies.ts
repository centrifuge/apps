import { encodeAddress } from '@polkadot/util-crypto'
import { filter, map, repeatWhen, switchMap } from 'rxjs/operators'
import { CentrifugeBase } from '../CentrifugeBase'
import { Account, TransactionOptions } from '../types'
import { addressToHex } from '../utils'

export function getProxiesModule(inst: CentrifugeBase) {
  // TODO: Probably remove this as getting all proxies from the chain could potentially be quite a lot of data
  // Used as a fallback for when the SubQuery is down
  function getAllProxies() {
    const $api = inst.getApi()
    const $events = inst.getEvents().pipe(
      filter(({ api, events }) => {
        const event = events.find(({ event }) => api.events.proxy.PureCreated.is(event))
        return !!event
      })
    )

    return $api.pipe(
      switchMap((api) => api.query.proxy.proxies.entries()),
      map((data) => {
        const proxiesByDelegate: Record<string, { delegator: string; delegatee: string; types: string[] }[]> = {}
        data
          .flatMap(([keyValue, dataValue]) => {
            const delegator = addressToHex((keyValue as any).toHuman()[0])
            const proxies = (dataValue as any).toHuman()[0] as { delegate: string; proxyType: string }[]
            return proxies.map((proxy) => ({
              delegator,
              delegatee: addressToHex(proxy.delegate),
              proxyType: proxy.proxyType,
            }))
          })
          .forEach((proxy) => {
            const index = proxiesByDelegate[proxy.delegatee]?.findIndex((p) => p.delegator === proxy.delegator)
            if (index > -1) {
              proxiesByDelegate[proxy.delegatee][index].types.push(proxy.proxyType)
            } else {
              ;(proxiesByDelegate[proxy.delegatee] || (proxiesByDelegate[proxy.delegatee] = [])).push({
                delegator: proxy.delegator,
                delegatee: proxy.delegatee,
                types: [proxy.proxyType],
              })
            }
          })
        return proxiesByDelegate
      }),
      repeatWhen(() => $events)
    )
  }

  function getUserProxies(args: [address: Account]) {
    const [address] = args

    return inst.getApi().pipe(
      switchMap((api) => {
        return inst.getSubqueryObservable<{
          proxies: { nodes: { delegator: string; delegatee: string; proxyType: string }[] }
        }>(
          `query($address: String!) {
          proxies(filter: { delegatee: { equalTo: $address }}) {
            nodes {
              delegator
              delegatee
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
        const proxies: Record<string, { delegator: string; delegatee: string; types: string[] }> = {}
        data?.proxies.nodes.forEach((node) => {
          const delegator = addressToHex(node.delegator)
          if (proxies[delegator]) {
            proxies[delegator].types.push(node.proxyType)
          } else {
            proxies[delegator] = {
              delegator,
              delegatee: addressToHex(node.delegatee),
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
        const proxiesByUser: Record<string, { delegator: string; delegatee: string; types: string[] }[]> = {}
        data?.proxies.nodes.forEach((node) => {
          const delegatee = addressToHex(node.delegatee)
          const delegator = addressToHex(node.delegator)
          const index = proxiesByUser[delegatee]?.findIndex((p) => p.delegator === delegator)
          if (index > -1) {
            proxiesByUser[delegatee][index].types.push(node.proxyType)
          } else {
            ;(proxiesByUser[delegatee] || (proxiesByUser[delegatee] = [])).push({
              delegator,
              delegatee,
              types: [node.proxyType],
            })
          }
        })
        console.log('roxiesByUser', proxiesByUser)
        return proxiesByUser
      })
    )
  }
  function createPure(_args: [], options?: TransactionOptions) {
    const $api = inst.getApi()

    return $api.pipe(
      switchMap((api) => {
        const submittable = api.tx.proxy.createPure('Any', 0, 0)
        return inst.wrapSignAndSend(api, submittable, options)
      })
    )
  }

  function addDelegate(args: [delegate: Account, proxyTypes: string[]], options?: TransactionOptions) {
    const [delegate, proxyTypes] = args
    const $api = inst.getApi()

    return $api.pipe(
      switchMap((api) => {
        let submittable
        if (proxyTypes.length === 1) {
          submittable = api.tx.proxy.addProxy(delegate, proxyTypes[0], 0)
        } else {
          submittable = api.tx.utility.batchAll(proxyTypes.map((t) => api.tx.proxy.addProxy(delegate, t, 0)))
        }
        return inst.wrapSignAndSend(api, submittable, options)
      })
    )
  }

  function removeDelegate(args: [delegate: Account, proxyTypes: string[]], options?: TransactionOptions) {
    const [delegate, proxyTypes] = args
    const $api = inst.getApi()

    return $api.pipe(
      switchMap((api) => {
        let submittable
        if (proxyTypes.length === 1) {
          submittable = api.tx.proxy.removeProxy(delegate, proxyTypes[0], 0)
        } else {
          submittable = api.tx.utility.batchAll(proxyTypes.map((t) => api.tx.proxy.removeProxy(delegate, t, 0)))
        }
        return inst.wrapSignAndSend(api, submittable, options)
      })
    )
  }

  return {
    getUserProxies,
    getMultiUserProxies,
    getAllProxies,
    createPure,
    addDelegate,
    removeDelegate,
  }
}
