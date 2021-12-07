import { StorageKey, u32 } from '@polkadot/types'
// import { AnyNumber } from '@polkadot/types/types'
import { CentrifugeBase } from '../CentrifugeBase'
import { TransactionOptions } from '../types'

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

const getRandomUint = () => (Math.random() * (2 ** 53 - 1)) >>> 0
const formatClassKey = (keys: StorageKey<[u32]>) => (keys.toHuman() as string[])[0].replace(/\D/g, '')
const formatInstanceKey = (keys: StorageKey<[u32, u32]>) => (keys.toHuman() as string[])[1].replace(/\D/g, '')

export function getNftsModule(inst: CentrifugeBase) {
  async function getCollections() {
    const api = await inst.getApi()

    const [metas, collections] = await Promise.all([
      api.query.uniques.classMetadataOf.entries(),
      api.query.uniques.class.entries(),
    ])

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
  }

  async function getCollectionNfts(args: [collectionId: string]) {
    const [collectionId] = args
    const api = await inst.getApi()

    const [metas, nfts] = await Promise.all([
      api.query.uniques.instanceMetadataOf.entries(collectionId),
      api.query.uniques.asset.entries(collectionId),
    ])

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
  }

  async function getAccountNfts(args: [address: string]) {
    const [address] = args
    const api = await inst.getApi()

    const keys = await api.query.uniques.account.keys(address)
    const keysArr = keys.map((k) => {
      const [, cid, aid] = k.toHuman() as any
      return [cid.replace(/\D/g, ''), aid.replace(/\D/g, '')]
    })
    const [metas, nfts] = await Promise.all([
      api.query.uniques.instanceMetadataOf.multi(keysArr),
      api.query.uniques.asset.multi(keysArr),
    ])

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
  }

  async function createCollection(
    args: [collectionId: string, owner: string, metadataUri: string],
    options?: TransactionOptions
  ) {
    const [collectionId, owner, metadataUri] = args
    const api = await inst.getApi()
    const submittable = api.tx.utility.batchAll([
      api.tx.uniques.create(collectionId, owner),
      api.tx.uniques.setClassMetadata(collectionId, metadataUri, true),
    ])
    return inst.wrapSignAndSend(api, submittable, options)
  }

  async function mintNft(
    args: [collectionId: string, nftId: string, owner: string, metadataUri: string],
    options?: TransactionOptions
  ) {
    const [collectionId, nftId, owner, metadataUri] = args
    const api = await inst.getApi()
    const submittable = api.tx.utility.batchAll([
      api.tx.uniques.mint(collectionId, nftId, owner),
      api.tx.uniques.setMetadata(collectionId, nftId, metadataUri, true),
    ])

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
  }
}
