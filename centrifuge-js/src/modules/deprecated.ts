import { StorageKey, u32 } from '@polkadot/types'
import BN from 'bn.js'
import { combineLatest, EMPTY, firstValueFrom } from 'rxjs'
import { expand, filter, map, repeatWhen, switchMap, take } from 'rxjs/operators'
import { CentrifugeBase } from '../CentrifugeBase'
import { TransactionOptions } from '../types'
import { getRandomUint, isSameAddress } from '../utils'

type Instance = {
  owner: string
  // approved: Option<AccountId32>;
  // isFrozen: bool;
  // deposit: u128;
}

export type NFT = Instance & {
  id: string
  collectionId: string
  metadataUri?: string
  sellPrice: string | null
}

type Class = {
  owner: string
  issuer: string
  admin: string
  // freezer: string
  // totalDeposit: u128
  // freeHolding: boolean
  instances: number
  // instanceMetadatas: u32
  // attributes: u32
  // isFrozen: boolean
}

export type Collection = Class & {
  id: string
  metadataUri?: string
}

const MAX_ATTEMPTS = 10

const formatClassKey = (keys: StorageKey<[u32]>) => (keys.toHuman() as string[])[0].replace(/\D/g, '')
const formatInstanceKey = (keys: StorageKey<[u32, u32]>) => (keys.toHuman() as string[])[1].replace(/\D/g, '')

export function getNftsModule__DEPRECATED(inst: CentrifugeBase) {
  console.log('🚀 ~ getNftsModule__DEPRECATED')
  function getCollections() {
    const $api = inst.getApi()

    const $events = inst.getEvents().pipe(
      filter(({ api, events }) => {
        const event = events.find(({ event }) => api.events.uniques.Created.is(event))
        return !!event
      })
    )

    return $api.pipe(
      switchMap((api) =>
        combineLatest([api.query.uniques.classMetadataOf.entries(), api.query.uniques.class.entries()])
      ),
      map(([metas, collections]) => {
        const metasObj = metas.reduce((acc, [keys, value]) => {
          // @ts-expect-error
          acc[formatClassKey(keys)] = value.toHuman()
          return acc
        }, {} as any)

        const mapped = collections.map(([keys, value]) => {
          // @ts-expect-error
          const id = formatClassKey(keys)
          const collectionValue = value.toJSON() as Class
          const collection: Collection = {
            id,
            admin: collectionValue.admin,
            owner: collectionValue.owner,
            issuer: collectionValue.issuer,
            instances: collectionValue.instances,
            metadataUri: metasObj[id]?.data,
          }
          return collection
        })

        return mapped
      }),
      repeatWhen(() => $events)
    )
  }

  function getCollection(args: [collectionId: string]) {
    const [collectionId] = args
    const $api = inst.getApi()

    return $api.pipe(
      switchMap((api) =>
        combineLatest([api.query.uniques.classMetadataOf(collectionId), api.query.uniques.class(collectionId)])
      ),
      map(([meta, collectionData]) => {
        const collectionValue = collectionData.toJSON() as Class
        if (!collectionValue) throw new Error('Collection not found')
        const collection: Collection = {
          id: collectionId,
          admin: collectionValue.admin,
          owner: collectionValue.owner,
          issuer: collectionValue.issuer,
          instances: collectionValue.instances,
          metadataUri: (meta.toHuman() as any)?.data,
        }
        return collection
      })
    )
  }

  function getCollectionNfts(args: [collectionId: string]) {
    const [collectionId] = args
    const $api = inst.getApi()

    const $events = inst.getEvents().pipe(
      filter(({ api, events }) => {
        const event = events.find(
          ({ event }) => api.events.uniques.Transferred.is(event) || api.events.uniques.Issued.is(event)
        )
        if (!event) return false

        const [cid] = (event.toHuman() as any).event.data
        return cid.replace(/\D/g, '') === collectionId
      })
    )

    return $api.pipe(
      switchMap((api) =>
        combineLatest([
          api.query.uniques.instanceMetadataOf.entries(collectionId),
          api.query.uniques.asset.entries(collectionId),
          api.query.nftSales.sales.entries(collectionId),
        ])
      ),
      map(([metas, nfts, sales]) => {
        const metasObj = metas.reduce((acc, [keys, value]) => {
          // @ts-expect-error
          acc[formatInstanceKey(keys)] = value.toHuman()
          return acc
        }, {} as any)

        const salesObj = sales.reduce((acc, [keys, value]) => {
          acc[formatInstanceKey(keys as StorageKey<[u32, u32]>)] = value.toJSON()
          return acc
        }, {} as any)

        const mapped = nfts.map(([keys, value]) => {
          // @ts-expect-error
          const id = formatInstanceKey(keys)
          const nftValue = value.toJSON() as Instance
          const nft: NFT = {
            id,
            collectionId,
            owner: salesObj[id]?.seller || nftValue.owner,
            metadataUri: metasObj[id]?.data,
            sellPrice: salesObj[id]?.seller ? parseHex(salesObj[id]?.price.amount) : null,
          }
          return nft
        })
        return mapped
      }),
      repeatWhen(() => $events)
    )
  }

  function getNft(args: [collectionId: string, nftId: string]) {
    const [collectionId, nftId] = args
    const $api = inst.getApi()

    return $api.pipe(
      switchMap((api) =>
        combineLatest([
          api.query.uniques.instanceMetadataOf(collectionId, nftId),
          api.query.uniques.asset(collectionId, nftId),
          api.query.nftSales.sales(collectionId, nftId),
        ])
      ),
      map(([meta, nftData, sale]) => {
        const nftValue = nftData.toJSON() as Instance
        const saleValue = sale.toJSON() as any
        if (!nftValue) throw new Error(`NFT not found: collectionId: ${collectionId}, nftId: ${nftId}`)
        const nft: NFT = {
          id: nftId,
          collectionId,
          owner: saleValue?.seller || nftValue.owner,
          metadataUri: (meta.toHuman() as any)?.data,
          sellPrice: saleValue ? parseHex(saleValue.price.amount) : null,
        }
        return nft
      })
    )
  }

  function getAccountNfts(args: [address: string]) {
    const [address] = args

    const $api = inst.getApi()

    const $events = inst.getEvents().pipe(
      filter(({ api, events }) => {
        const event = events.find(
          ({ event }) => api.events.uniques.Transferred.is(event) || api.events.uniques.Issued.is(event)
        )
        if (!event) return false

        const [, , from, to] = (event.toJSON() as any).event.data
        return isSameAddress(address, from) || (to && isSameAddress(address, to))
      })
    )

    return $api.pipe(
      switchMap(
        (api) =>
          combineLatest([api.query.uniques.account.keys(address), api.query.nftSales.nftsBySeller.keys(address)]),
        (api, [accountKeys, salesKeys]) => ({
          api,
          accountKeys,
          salesKeys,
        })
      ),
      switchMap(({ api, accountKeys, salesKeys }) => {
        const accountkeysArr = accountKeys.map((k) => {
          const [, cid, nid] = k.toHuman() as any
          return [cid.replace(/\D/g, ''), nid.replace(/\D/g, '')]
        })
        const salesKeysArr = salesKeys.map((k) => {
          const [, cid, nid] = k.toHuman() as any
          return [cid.replace(/\D/g, ''), nid.replace(/\D/g, '')]
        })
        const keysArr = salesKeysArr.concat(accountkeysArr)
        return combineLatest([
          api.query.uniques.instanceMetadataOf.multi(keysArr),
          api.query.uniques.asset.multi(keysArr),
          api.query.nftSales.sales.multi(salesKeysArr),
        ]).pipe(
          map(([metas, nfts, sales]) => {
            const mapped = nfts.map((value, i) => {
              const [collectionId, id] = keysArr[i]
              const instance = value.toJSON() as Instance
              const sale = sales[i]?.toJSON() as any
              const nft: NFT = {
                id,
                collectionId,
                owner: sale?.seller || instance.owner,
                metadataUri: (metas[i]?.toHuman() as any)?.data,
                sellPrice: sale ? parseHex(sale.price.amount) : null,
              }
              return nft
            })
            return mapped
          }),
          take(1)
        )
      }),
      repeatWhen(() => $events)
    )
  }

  function createCollection(
    args: [collectionId: string, owner: string, metadataUri: string],
    options?: TransactionOptions
  ) {
    const [collectionId, owner, metadataUri] = args

    const $api = inst.getApi()

    return $api.pipe(
      map((api) => ({
        api,
        submittable: api.tx.utility.batchAll([
          api.tx.uniques.create(collectionId, owner),
          api.tx.uniques.setClassMetadata(collectionId, metadataUri, true),
        ]),
      })),
      switchMap(({ api, submittable }) => inst.wrapSignAndSend(api, submittable, options))
    )
  }

  function transferNft(
    args: [collectionId: string, nftId: string, recipientAddress: string],
    options?: TransactionOptions
  ) {
    const $api = inst.getApi()

    return $api.pipe(
      map((api) => ({
        api,
        submittable: api.tx.uniques.transfer(...args),
      })),
      switchMap(({ api, submittable }) => inst.wrapSignAndSend(api, submittable, options))
    )
  }

  function mintNft(
    args: [collectionId: string, nftId: string, owner: string, metadataUri: string, amount?: number],
    options?: TransactionOptions
  ) {
    const [collectionId, nftId, owner, metadataUri] = args
    const $api = inst.getApi()

    return $api.pipe(
      map((api) => ({
        api,
        submittable: api.tx.utility.batchAll([
          api.tx.uniques.mint(collectionId, nftId, owner),
          api.tx.uniques.setMetadata(collectionId, nftId, metadataUri, true),
        ]),
      })),
      switchMap(({ api, submittable }) => inst.wrapSignAndSend(api, submittable, options))
    )
  }

  function sellNft(args: [collectionId: string, nftId: string, price: BN], options?: TransactionOptions) {
    const [collectionId, nftId, price] = args
    const $api = inst.getApi()
    return $api.pipe(
      map((api) => ({
        api,
        submittable: api.tx.nftSales.add(collectionId, nftId, ['Native', price.toString()]),
      })),
      switchMap(({ api, submittable }) => inst.wrapSignAndSend(api, submittable, options))
    )
  }

  function removeNftListing(args: [collectionId: string, nftId: string], options?: TransactionOptions) {
    const [collectionId, nftId] = args
    const $api = inst.getApi()
    return $api.pipe(
      map((api) => ({
        api,
        submittable: api.tx.nftSales.remove(collectionId, nftId),
      })),
      switchMap(({ api, submittable }) => inst.wrapSignAndSend(api, submittable, options))
    )
  }

  function buyNft(args: [collectionId: string, nftId: string, maxPrice: BN], options?: TransactionOptions) {
    const [collectionId, nftId, price] = args
    const $api = inst.getApi()
    return $api.pipe(
      map((api) => ({
        api,
        submittable: api.tx.nftSales.buy(collectionId, nftId, ['Native', price.toString()]),
      })),
      switchMap(({ api, submittable }) => inst.wrapSignAndSend(api, submittable, options))
    )
  }

  async function getAvailableCollectionId() {
    const $api = inst.getApi()

    try {
      const res = await firstValueFrom(
        $api.pipe(
          map((api) => ({
            api,
            id: null,
            triesLeft: MAX_ATTEMPTS,
          })),
          expand(({ api, triesLeft }) => {
            const id = String(getRandomUint())
            if (triesLeft <= 0) return EMPTY

            return api.query.uniques.class(id).pipe(
              map((res) => ({ api, id: res.toJSON() === null ? id : null, triesLeft: triesLeft - 1 })),
              take(1)
            )
          }),
          filter(({ id }) => !!id)
        )
      )

      return res.id as string
    } catch (e) {
      throw new Error(`Could not find an available collection ID in ${MAX_ATTEMPTS} attempts`)
    }
  }

  async function getAvailableNftId(collectionId: string) {
    const $api = inst.getApi()
    try {
      const res = await firstValueFrom(
        $api.pipe(
          map((api) => ({
            api,
            id: null,
            triesLeft: MAX_ATTEMPTS,
          })),
          expand(({ api, triesLeft }) => {
            const id = String(getRandomUint())
            if (triesLeft <= 0) return EMPTY

            return api.query.uniques.asset(collectionId, id).pipe(
              map((res) => ({ api, id: res.toJSON() === null ? id : null, triesLeft: triesLeft - 1 })),
              take(1)
            )
          }),
          filter(({ id }) => !!id)
        )
      )

      return res.id as string
    } catch (e) {
      throw new Error(`Could not find an available NFT ID in ${MAX_ATTEMPTS} attempts`)
    }
  }

  return {
    getCollections,
    getCollection,
    getCollectionNfts,
    getAccountNfts,
    getNft,
    getAvailableCollectionId,
    getAvailableNftId,
    createCollection,
    mintNft,
    transferNft,
    sellNft,
    removeNftListing,
    buyNft,
  }
}

const parseHex = (value: string | number) => {
  return new BN(value.toString().substring(2), 'hex').toString()
}
