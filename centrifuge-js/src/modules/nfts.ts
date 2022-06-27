import { ApiPromise } from '@polkadot/api'
import { StorageKey, u32 } from '@polkadot/types'
import BN from 'bn.js'
// import { AnyNumber } from '@polkadot/types/types'
import { CentrifugeBase } from '../CentrifugeBase'
import { TransactionOptions } from '../types'
import { getRandomUint } from '../utils'

type Item = {
  owner: string
}

export type NFT = Item & {
  id: string
  collectionId: string
  metadataUri?: string
  sellPrice: string | null
}

type Class = {
  owner: string
  issuer: string
  admin: string
  items?: number
  /** @deprecated */
  instances?: number
}

type Specs = {
  specVersion: number
  specName: string
}

export type Collection = Class & {
  id: string
  metadataUri?: string
}

const MAX_ATTEMPTS = 10

const formatCollectionKey = (keys: StorageKey<[u32]>) => (keys.toHuman() as string[])[0].replace(/\D/g, '')
const formatItemKey = (keys: StorageKey<[u32, u32]>) => (keys.toHuman() as string[])[1].replace(/\D/g, '')

export function getNftsModule(inst: CentrifugeBase) {
  function getVersionSpec(api: ApiPromise) {
    return api.query.system.lastRuntimeUpgrade()
  }

  async function getCollections() {
    const api = await inst.getApi()

    const specVersion = await getVersionSpec(api)

    const [metas, collections] = await Promise.all([
      api.query.uniques.classMetadataOf.entries(),
      api.query.uniques.class.entries(),
    ])

    const metasObj = metas.reduce((acc, [keys, value]) => {
      acc[formatCollectionKey(keys)] = value.toHuman()
      return acc
    }, {} as any)

    const mapped = collections.map(([keys, value]) => {
      const id = formatCollectionKey(keys)
      const collectionValue = value.toJSON() as Class
      const collection: Collection = {
        id,
        admin: collectionValue.admin,
        owner: collectionValue.owner,
        issuer: collectionValue.issuer,
        items: (specVersion?.toJSON() as Specs).specVersion > 1007 ? collectionValue.items : collectionValue.instances,
        metadataUri: metasObj[id]?.data,
      }
      return collection
    })
    return mapped
  }

  async function getCollectionNfts(args: [collectionId: string]) {
    const [collectionId] = args
    const api = await inst.getApi()

    const [metas, nfts, sales] = await Promise.all([
      api.query.uniques.instanceMetadataOf.entries(collectionId),
      api.query.uniques.asset.entries(collectionId),
      api.query.nftSales.sales.entries(collectionId),
    ])

    const metasObj = metas.reduce((acc, [keys, value]) => {
      acc[formatItemKey(keys)] = value.toHuman()
      return acc
    }, {} as any)

    const salesObj = sales.reduce((acc, [keys, value]) => {
      acc[formatItemKey(keys as StorageKey<[u32, u32]>)] = value.toJSON()
      return acc
    }, {} as any)

    const mapped = nfts.map(([keys, value]) => {
      const id = formatItemKey(keys)
      const nftValue = value.toJSON() as Item
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
  }

  async function getAccountNfts(args: [address: string]) {
    const [address] = args
    const api = await inst.getApi()

    const [accountKeys, salesKeys] = await Promise.all([
      api.query.uniques.account.keys(address),
      api.query.nftSales.nftsBySeller.keys(address),
    ])
    const accountkeysArr = accountKeys.map((k) => {
      const [, cid, nid] = k.toHuman() as any
      return [cid.replace(/\D/g, ''), nid.replace(/\D/g, '')]
    })
    const salesKeysArr = salesKeys.map((k) => {
      const [, cid, nid] = k.toHuman() as any
      return [cid.replace(/\D/g, ''), nid.replace(/\D/g, '')]
    })
    const keysArr = salesKeysArr.concat(accountkeysArr)
    const [metas, nfts, sales] = await Promise.all([
      api.query.uniques.instanceMetadataOf.multi(keysArr),
      api.query.uniques.asset.multi(keysArr),
      api.query.nftSales.sales.multi(salesKeysArr),
    ])

    const mapped = nfts.map((value, i) => {
      const [collectionId, id] = keysArr[i]
      const item = value.toJSON() as Item
      const sale = sales[i]?.toJSON() as any
      const nft: NFT = {
        id,
        collectionId,
        owner: item.owner,
        metadataUri: (metas[i]?.toHuman() as any)?.data,
        sellPrice: sale ? parseHex(sale.price.amount) : null,
      }
      return nft
    })
    return mapped
  }

  async function createCollection(
    args: [collectionId: string, owner: string, metadataUri: string],
    options?: TransactionOptions
  ) {
    const [collectionId, owner, metadataUri] = args
    const api = await inst.getApi()
    const specs = (await (await getVersionSpec(api)).toJSON()) as Specs

    const submittable = api.tx.utility.batchAll([
      api.tx.uniques.create(collectionId, owner),
      api.tx.uniques[specs.specVersion > 1007 ? 'setCollectionMetadata' : 'setClassMetadata'](
        collectionId,
        metadataUri,
        true
      ),
    ])

    return inst.wrapSignAndSend(api, submittable, options)
  }

  async function mintNft(
    args: [collectionId: string, nftId: string, owner: string, metadataUri: string, amount?: number],
    options?: TransactionOptions
  ) {
    const [collectionId, nftId, owner, metadataUri, amount] = args
    const api = await inst.getApi()

    let submittable
    if (amount && amount > 1) {
      let tx: any[] = []
      for (let i = 0; i < amount; i++) {
        const nftId = await getAvailableNftId(collectionId)
        tx = tx.concat([
          api.tx.uniques.mint(collectionId, nftId, owner),
          api.tx.uniques.setMetadata(collectionId, nftId, metadataUri, true),
        ])
      }

      submittable = api.tx.utility.batchAll(tx)
    } else {
      submittable = api.tx.utility.batchAll([
        api.tx.uniques.mint(collectionId, nftId, owner),
        api.tx.uniques.setMetadata(collectionId, nftId, metadataUri, true),
      ])
    }

    return inst.wrapSignAndSend(api, submittable, options)
  }

  async function transferNft(
    args: [collectionId: string, nftId: string, recipientAddress: string],
    options?: TransactionOptions
  ) {
    const api = await inst.getApi()
    const submittable = api.tx.uniques.transfer(...args)
    return inst.wrapSignAndSend(api, submittable, options)
  }

  async function sellNft(args: [collectionId: string, nftId: string, price: BN], options?: TransactionOptions) {
    const [collectionId, nftId, price] = args
    const api = await inst.getApi()
    const submittable = api.tx.nftSales.add(collectionId, nftId, ['Native', price.toString()])
    return inst.wrapSignAndSend(api, submittable, options)
  }

  async function removeNftListing(args: [collectionId: string, nftId: string], options?: TransactionOptions) {
    const [collectionId, nftId] = args
    const api = await inst.getApi()
    const submittable = api.tx.nftSales.remove(collectionId, nftId)
    return inst.wrapSignAndSend(api, submittable, options)
  }

  async function buyNft(args: [collectionId: string, nftId: string, maxPrice: BN], options?: TransactionOptions) {
    const [collectionId, nftId, price] = args
    const api = await inst.getApi()
    const submittable = api.tx.nftSales.buy(collectionId, nftId, ['Native', price.toString()])
    return inst.wrapSignAndSend(api, submittable, options)
  }

  async function getAvailableCollectionId() {
    const api = await inst.getApi()
    for (let i = 0; i < MAX_ATTEMPTS; i += 1) {
      const id = String(getRandomUint())
      const res = await api.query.uniques.class(id)
      if (res.toJSON() === null) {
        return id
      }
    }
    throw new Error(`Could not find an available collection ID in ${MAX_ATTEMPTS} attempts`)
  }

  async function getAvailableNftId(collectionId: string) {
    const api = await inst.getApi()
    for (let i = 0; i < MAX_ATTEMPTS; i += 1) {
      const id = String(getRandomUint())
      const res = await api.query.uniques.asset(collectionId, id)
      if (res.toJSON() === null) {
        return id
      }
    }
    throw new Error(`Could not find an available NFT ID in ${MAX_ATTEMPTS} attempts`)
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
    sellNft,
    removeNftListing,
    buyNft,
  }
}

const parseHex = (value: string | number) => {
  return new BN(value.toString().substring(2), 'hex').toString()
}
