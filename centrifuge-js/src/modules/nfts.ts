import { ApiPromise } from '@polkadot/api'
import { CentrifugeBaseConstructorLike } from '../CentrifugeBase'
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

export function WithNfts<Base extends CentrifugeBaseConstructorLike>(base: Base) {
  return class extends base {
    nfts = {
      getAccountNfts: async (address: string) => {
        const api = await this.getApi()

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
      },
      transferNft: async (args: Parameters<ApiPromise['tx']['uniques']['transfer']>, options?: TransactionOptions) => {
        const api = await this.getApi()
        const submittable = api.tx.uniques.transfer(...args)
        return this.wrapSignAndSend(api, submittable, options)
      },
    }
  }
}
