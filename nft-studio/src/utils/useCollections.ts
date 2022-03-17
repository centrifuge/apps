import * as React from 'react'
import { FEATURED_COLLECTIONS } from '../config'
import { collectionMetadataSchema } from '../schemas'
import { useCentrifugeQuery } from './useCentrifugeQuery'
import { useMetadata } from './useMetadata'

export function useCollections() {
  const [result] = useCentrifugeQuery(['collections'], (cent) => cent.nfts.getCollections(), { suspense: true })

  return result
}

export function useCollection(id?: string) {
  const [result] = useCentrifugeQuery(['collection', id], (cent) => cent.nfts.getCollection([id!]), {
    suspense: true,
    enabled: !!id,
  })

  return result
}

export function useCollectionMetadata(id?: string) {
  const collection = useCollection(id)
  return useMetadata(collection?.metadataUri, collectionMetadataSchema)
}

export function useFeaturedCollections() {
  const data = useCollections()
  return React.useMemo(() => {
    return data?.filter((c) => FEATURED_COLLECTIONS.includes(c.id))
  }, [data])
}
