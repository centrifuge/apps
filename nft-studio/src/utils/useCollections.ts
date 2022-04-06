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

export function useFeaturedCollections() {
  const { data } = useCollections()
  return React.useMemo(() => {
    return data?.filter((c) => FEATURED_COLLECTIONS.includes(c.id))
  }, [data])
}
