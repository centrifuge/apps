import { useQuery } from 'react-query'
import { parseMetadataUrl } from './parseMetadataUrl'

export function useMetadata<T extends object>(uri?: string) {
  const query = useQuery<Partial<T>>(
    ['metadata', uri],
    async () => {
      const res = await fetch(uri!)
        .catch((e) => {
          if (!uri!.startsWith('ipfs://')) throw e
          // in case of error, try to fetch the metadata from the default gateway
          return fetch(parseMetadataUrl(uri!))
        })
        .then((res) => res.json())
      return res
    },
    {
      enabled: !!uri,
      staleTime: Infinity,
    }
  )

  return query
}
