import { StorageKey, u32 } from '@polkadot/types'
import { combineLatest, EMPTY, firstValueFrom, lastValueFrom } from 'rxjs'
import { expand, filter, map, switchMap, take } from 'rxjs/operators'
// import { AnyNumber } from '@polkadot/types/types'
import { CentrifugeBase } from '../CentrifugeBase'
import { TransactionOptions } from '../types'
import { getRandomUint } from '../utils'

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

export function getNftsModule(inst: CentrifugeBase) {
  function getCollections() {
    const $api = inst.getRxApi()

    return $api.pipe(
      switchMap((api) =>
        combineLatest([api.query.uniques.classMetadataOf.entries(), api.query.uniques.class.entries()])
      ),
      map(([metas, collections]) => {
        const metasObj = metas.reduce((acc, [keys, value]) => {
          acc[formatClassKey(keys)] = value.toHuman()
          return acc
        }, {} as any)

        const mapped = collections.map(([keys, value]) => {
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
      })
    )
  }

  function getCollectionNfts(args: [collectionId: string]) {
    const [collectionId] = args
    const $api = inst.getRxApi()

    return $api.pipe(
      switchMap((api) =>
        combineLatest([
          api.query.uniques.instanceMetadataOf.entries(collectionId),
          api.query.uniques.asset.entries(collectionId),
          api.query.system.number(),
        ])
      ),
      map(([metas, nfts, number]) => {
        console.log('number', number)
        const metasObj = metas.reduce((acc, [keys, value]) => {
          acc[formatInstanceKey(keys)] = value.toHuman()
          return acc
        }, {} as any)

        const mapped = nfts.map(([keys, value]) => {
          const id = formatInstanceKey(keys)
          const nftValue = value.toJSON() as Instance
          const nft: NFT = {
            id,
            collectionId,
            owner: nftValue.owner,
            metadataUri: metasObj[id]?.data,
          }
          return nft
        })
        return mapped
      })
    )
  }

  function getAccountNfts(args: [address: string]) {
    const [address] = args

    const $api = inst.getRxApi()

    return $api.pipe(
      switchMap(
        (api) => api.query.uniques.account.keys(address),
        (api, keys) => ({
          api,
          keys,
        })
      ),
      switchMap(({ api, keys }) => {
        const keysArr = keys.map((k) => {
          const [, cid, aid] = k.toHuman() as any
          return [cid.replace(/\D/g, ''), aid.replace(/\D/g, '')]
        })
        return combineLatest([
          api.query.uniques.instanceMetadataOf.multi(keysArr),
          api.query.uniques.asset.multi(keysArr),
        ]).pipe(
          map(([metas, nfts]) => {
            const mapped = nfts.map((value, i) => {
              const [collectionId, id] = keysArr[i]
              const instance = value.toJSON() as Instance
              const nft: NFT = {
                id,
                collectionId,
                owner: instance.owner,
                metadataUri: (metas[i]?.toHuman() as any)?.data,
              }
              return nft
            })
            return mapped
          })
        )
      })
    )
  }

  function createCollection(
    args: [collectionId: string, owner: string, metadataUri: string],
    options?: TransactionOptions
  ) {
    const [collectionId, owner, metadataUri] = args

    const $api = inst.getRxApi()

    return lastValueFrom(
      $api.pipe(
        map((api) => ({
          api,
          submittable: api.tx.utility.batchAll([
            api.tx.uniques.create(collectionId, owner),
            api.tx.uniques.setClassMetadata(collectionId, metadataUri, true),
          ]),
        })),
        switchMap(({ api, submittable }) => inst.wrapSignAndSendRx(api, submittable, options))
      )
    )
  }

  async function transferNft(
    args: [collectionId: string, nftId: string, recipientAddress: string],
    options?: TransactionOptions
  ) {
    const $api = inst.getRxApi()

    return lastValueFrom(
      $api.pipe(
        map((api) => ({
          api,
          submittable: api.tx.uniques.transfer(...args),
        })),
        switchMap(({ api, submittable }) => inst.wrapSignAndSendRx(api, submittable, options))
      )
    )
  }

  async function mintNft(
    args: [collectionId: string, nftId: string, owner: string, metadataUri: string],
    options?: TransactionOptions
  ) {
    const [collectionId, nftId, owner, metadataUri] = args
    const $api = inst.getRxApi()

    return lastValueFrom(
      $api.pipe(
        map((api) => ({
          api,
          submittable: api.tx.utility.batchAll([
            api.tx.uniques.mint(collectionId, nftId, owner),
            api.tx.uniques.setMetadata(collectionId, nftId, metadataUri, true),
          ]),
        })),
        switchMap(({ api, submittable }) => inst.wrapSignAndSendRx(api, submittable, options))
      )
    )
  }

  async function getAvailableCollectionId() {
    const $api = inst.getRxApi()

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
    const $api = inst.getRxApi()
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
    getCollectionNfts,
    getAccountNfts,
    getAvailableCollectionId,
    getAvailableNftId,
    createCollection,
    mintNft,
    transferNft,
  }
}
