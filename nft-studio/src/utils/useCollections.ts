import { StorageKey, u32 } from '@polkadot/types'
import * as React from 'react'
import { useQuery } from 'react-query'
import { useMetadata } from './useMetadata'
import { initPolkadotApi } from './web3'

type CollectionValue = {
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

const formatStorageKey = (keys: StorageKey<[u32]>) => (keys.toHuman() as string[])[0].replace(/\D/g, '')

export type Collection = CollectionValue & {
  id: string
  metadataUri?: string
}

export function useCollections() {
  const query = useQuery(
    ['collections'],
    async () => {
      const api = await initPolkadotApi()

      const [metas, collections] = await Promise.all([
        api.query.uniques.classMetadataOf.entries(),
        api.query.uniques.class.entries(),
      ])

      const metasObj = metas.reduce((acc, [keys, value]) => {
        acc[formatStorageKey(keys)] = value.toHuman()
        return acc
      }, {} as any)

      const mapped = collections.map(([keys, value]) => {
        const id = formatStorageKey(keys)
        const collectionValue = value.toJSON() as CollectionValue
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
      console.log('collections', collections, metas, mapped)
      return mapped
    },
    {
      suspense: true,
    }
  )

  return query
}

export function useCollection(id?: string) {
  const { data } = useCollections()
  return React.useMemo(() => data?.find((c) => c.id === id), [data, id])
}

export function useCollectionMetadata(id?: string) {
  const collection = useCollection(id)
  return useMetadata<{ name: string; description: string }>(collection?.metadataUri)
}

export function useCollectionNFTsPreview(id: string) {
  const { data } = useCollections()
  const query = useQuery(
    ['collectionPreview', id],
    async () => {
      const api = await initPolkadotApi()
      const collection = data!.find((c) => c.id === id)
      if (!collection) return null

      const metas = await api.query.uniques.instanceMetadataOf.entriesPaged({ pageSize: 4, args: [collection.id] })

      const mapped = metas.map(([keys, value]) => {
        const id = (keys.toHuman() as string[])[0]
        const metaValue = value.toHuman() as any
        const meta = {
          id,
          metadataUri: metaValue.data,
        }
        return meta
      })

      return mapped
    },
    {
      enabled: !!data,
      staleTime: Infinity,
    }
  )

  return query
}
