import { StorageKey, u32 } from '@polkadot/types'
import { EMPTY, combineLatest, firstValueFrom } from 'rxjs'
import { expand, filter, map, repeatWhen, switchMap, take } from 'rxjs/operators'
import { Centrifuge } from '../Centrifuge'
import { TransactionOptions } from '../types'
import { addressToHex, getRandomUint, isSameAddress } from '../utils'

type Item = {
  owner: string
}

export type NFT = Item & {
  id: string
  collectionId: string
  metadataUri?: string
}

type Class = {
  owner: string
  issuer: string
  admin: string
  items: number
}

export type Collection = Class & {
  id: string
  metadataUri?: string
}

export type CollectionMetadataInput = {
  name: string
  description: string
  image?: string
}

export type NFTMetadataInput = {
  name: string
  description?: string
  image?: string
  properties?: Record<string, string | number>
}

const MAX_ATTEMPTS = 10

const formatCollectionKey = (keys: StorageKey<[u32]>) => (keys.toHuman() as string[])[0].replace(/\D/g, '')
const formatItemKey = (keys: StorageKey<[u32, u32]>) => (keys.toHuman() as string[])[1].replace(/\D/g, '')

export function getNftsModule(inst: Centrifuge) {
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
          acc[formatCollectionKey(keys)] = value.toHuman()
          return acc
        }, {} as any)

        const mapped = collections.map(([keys, value]) => {
          // @ts-expect-error
          const id = formatCollectionKey(keys)
          const collectionValue = value.toJSON() as Class
          const collection: Collection = {
            id,
            admin: addressToHex(collectionValue.admin),
            owner: addressToHex(collectionValue.owner),
            issuer: addressToHex(collectionValue.issuer),
            items: collectionValue.items,
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
          admin: addressToHex(collectionValue.admin),
          owner: addressToHex(collectionValue.owner),
          issuer: addressToHex(collectionValue.issuer),
          items: collectionValue.items,
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
        ])
      ),
      map(([metas, nfts]) => {
        const metasObj = metas.reduce((acc, [keys, value]) => {
          // @ts-expect-error
          acc[formatItemKey(keys)] = value.toHuman()
          return acc
        }, {} as any)

        const mapped = nfts.map(([keys, value]) => {
          // @ts-expect-error
          const id = formatItemKey(keys)
          const nftValue = value.toJSON() as Item
          const nft: NFT = {
            id,
            collectionId,
            owner: nftValue.owner,
            metadataUri: metasObj[id]?.data,
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
        ])
      ),
      map(([meta, nftData]) => {
        const nftValue = nftData.toJSON() as Item
        if (!nftValue) throw new Error(`NFT not found: collectionId: ${collectionId}, nftId: ${nftId}`)
        const nft: NFT = {
          id: nftId,
          collectionId,
          owner: addressToHex(nftValue.owner),
          metadataUri: (meta.toHuman() as any)?.data,
        }
        return nft
      })
    )
  }

  function getNfts(args: [collectionId: string, nftIds: string[]]) {
    const [collectionId, nftIds] = args
    const $api = inst.getApi()

    return $api.pipe(
      switchMap((api) =>
        api.queryMulti(
          nftIds
            .map((nftId) => [
              [api.query.uniques.instanceMetadataOf, [collectionId, nftId]],
              [api.query.uniques.asset, [collectionId, nftId]],
            ])
            .flat(1) as any
        )
      ),
      map((data) => {
        const nfts = nftIds
          .map((nftId, i) => {
            const [meta, nftData] = data.slice(i * 2, i * 2 + 2)
            const nftValue = nftData.toJSON() as Item
            if (!nftValue) {
              console.warn(`NFT not found: collectionId: ${collectionId}, nftId: ${nftId}`)
              return null as never
            }
            const nft: NFT = {
              id: nftId,
              collectionId,
              owner: addressToHex(nftValue.owner),
              metadataUri: (meta.toHuman() as any)?.data,
            }
            return nft
          })
          .filter(Boolean)
        return nfts
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
        (api) => combineLatest([api.query.uniques.account.keys(address)]),
        (api, [accountKeys]) => ({
          api,
          accountKeys,
        })
      ),
      switchMap(({ api, accountKeys }) => {
        const keysArr = accountKeys.map((k) => {
          const [, cid, nid] = k.toHuman() as any
          return [cid.replace(/\D/g, ''), nid.replace(/\D/g, '')]
        })
        return combineLatest([
          api.query.uniques.instanceMetadataOf.multi(keysArr),
          api.query.uniques.asset.multi(keysArr),
        ]).pipe(
          map(([metas, nfts]) => {
            const mapped = nfts.map((value, i) => {
              const [collectionId, id] = keysArr[i]
              const instance = value.toJSON() as Item
              const nft: NFT = {
                id,
                collectionId,
                owner: addressToHex(instance.owner),
                metadataUri: (metas[i]?.toHuman() as any)?.data,
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
    args: [collectionId: string, owner: string, metadata: CollectionMetadataInput],
    options?: TransactionOptions
  ) {
    const [collectionId, owner, metadata] = args

    const $api = inst.getApi()
    const $pinnedMetadata = inst.metadata.pinJson({
      image: metadata.image,
      name: metadata.name,
      description: metadata.description,
    })
    return combineLatest([$api, $pinnedMetadata]).pipe(
      map(([api, pinnedMetadata]) => {
        return {
          api,
          submittable: api.tx.utility.batchAll([
            api.tx.uniques.create(collectionId, owner),
            api.tx.uniques.setCollectionMetadata(collectionId, pinnedMetadata.uri, true),
          ]),
        }
      }),
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
    args: [collectionId: string, nftId: string, owner: string, metadata: NFTMetadataInput],
    options?: TransactionOptions
  ) {
    const $api = inst.getApi()
    const [collectionId, nftId, owner, metadata] = args

    const $pinnedMetadata = inst.metadata.pinJson({
      image: metadata.image,
      name: metadata.name,
      description: metadata.description,
      properties: metadata.properties || {},
    })
    return combineLatest([$api, $pinnedMetadata]).pipe(
      map(([api, pinnedMetadata]) => {
        return {
          api,
          submittable: api.tx.utility.batchAll([
            api.tx.uniques.mint(collectionId, nftId, owner),
            api.tx.uniques.setMetadata(collectionId, nftId, pinnedMetadata.uri, true),
          ]),
        }
      }),
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
    getNfts,
    getAvailableCollectionId,
    getAvailableNftId,
    createCollection,
    mintNft,
    transferNft,
  }
}
