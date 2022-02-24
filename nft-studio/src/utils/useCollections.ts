import * as React from 'react'
import { useQuery } from 'react-query'
import { firstValueFrom } from 'rxjs'
import { map, switchMap } from 'rxjs/operators'
import { useCentrifuge } from '../components/CentrifugeProvider'
import { collectionMetadataSchema } from '../schemas'
import { useCentrifugeQuery } from './useCentrifugeQuery'
import { useMetadata } from './useMetadata'

export function useCollections() {
  const [result] = useCentrifugeQuery(['collections'], (cent) => cent.nfts.getCollections(), { suspense: true })

  return result
}

export function useCollection(id?: string) {
  const collections = useCollections()
  return React.useMemo(() => collections?.find((c) => c.id === id), [collections, id])
}

export function useCollectionMetadata(id?: string) {
  const collection = useCollection(id)
  return useMetadata(collection?.metadataUri, collectionMetadataSchema)
}

export function useCollectionNFTsPreview(id: string) {
  const collections = useCollections()
  const cent = useCentrifuge()
  const query = useQuery(
    ['collectionPreview', id],
    async () => {
      const collection = collections!.find((c) => c.id === id)
      if (!collection) return null
      return firstValueFrom(
        cent.getRxApi().pipe(
          switchMap((api) => api.query.uniques.instanceMetadataOf.entriesPaged({ pageSize: 4, args: [collection.id] })),
          map((metas) => {
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
          })
        )
      )
    },
    {
      enabled: !!collections,
      staleTime: Infinity,
    }
  )

  return query.data
}
