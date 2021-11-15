import { StorageKey, u32 } from '@polkadot/types'
import * as React from 'react'
import { useQuery } from 'react-query'
import { initPolkadotApi } from './web3'

const formatStorageKey = (keys: StorageKey<[u32, u32]>) => (keys.toHuman() as string[])[1].replace(/\D/g, '')

type NFTValue = {
  owner: string
  // approved: Option<AccountId32>;
  // isFrozen: bool;
  // deposit: u128;
}

export type NFT = NFTValue & {
  id: string
  collectionId: string
  metadataUri?: string
}

export function useNFTs(collectionId: string) {
  const query = useQuery(
    ['nfts', collectionId],
    async () => {
      const api = await initPolkadotApi()

      const [metas, nfts] = await Promise.all([
        api.query.uniques.instanceMetadataOf.entries(collectionId),
        api.query.uniques.asset.entries(collectionId),
      ])

      const metasObj = metas.reduce((acc, [keys, value]) => {
        acc[formatStorageKey(keys)] = value.toHuman()
        return acc
      }, {} as any)

      const mapped = nfts.map(([keys, value]) => {
        const id = formatStorageKey(keys)
        const nftValue = value.toJSON() as NFTValue
        const nft: NFT = {
          id,
          collectionId,
          owner: nftValue.owner,
          metadataUri: metasObj[id]?.data,
        }
        return nft
      })
      console.log('nfts', nfts, metas, mapped)
      return mapped
    },
    {
      suspense: true,
    }
  )

  return query
}

export function useNFT(collectionId: string, nftId: string) {
  const { data } = useNFTs(collectionId)
  return React.useMemo(() => data?.find((c) => c.id === nftId), [data, nftId])
}
