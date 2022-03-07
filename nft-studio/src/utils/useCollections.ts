import * as React from 'react'
import { useQuery } from 'react-query'
import { useCentrifuge } from '../components/CentrifugeProvider'
import { FEATURED_COLLECTIONS } from '../config'
import { collectionMetadataSchema } from '../schemas'
import { useMetadata } from './useMetadata'

export function useCollections() {
  const cent = useCentrifuge()
  const query = useQuery(
    ['collections'],
    async () => {
      return cent.nfts.getCollections()
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
  return useMetadata(collection?.metadataUri, collectionMetadataSchema)
}

export function useCollectionNFTsPreview(id: string) {
  const { data } = useCollections()
  const cent = useCentrifuge()
  const query = useQuery(
    ['collectionPreview', id],
    async () => {
      const api = await cent.getApi()
      const collection = data!.find((c) => c.id === id)
      if (!collection) return null

      const metas = await api.query.uniques.instanceMetadataOf.entriesPaged({ pageSize: 4, args: [collection.id] })

      const mapped = metas.map(([keys, value]) => {
        const id = (keys.toHuman() as string[])[0]
        const metaValue = value.toHuman() as any
        const meta = {
          id,
          metadataUri: metaValue.data as string | undefined,
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

export function useFeaturedCollections() {
  const { data } = useCollections()
  return React.useMemo(() => {
    return data?.filter((c) => FEATURED_COLLECTIONS.includes(c.id))
  }, [data])
}
