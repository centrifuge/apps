import { map, switchMap } from 'rxjs/operators'
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

export function useCollectionNFTsPreview(id: string) {
  const [result] = useCentrifugeQuery(
    ['collectionPreview', id],
    (cent) =>
      cent.getRxApi().pipe(
        switchMap((api) => api.query.uniques.instanceMetadataOf.entriesPaged({ pageSize: 4, args: [id] })),
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
      ),
    {
      enabled: !!id,
    }
  )

  return result
}
