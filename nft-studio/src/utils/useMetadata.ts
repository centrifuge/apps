import { useQuery } from 'react-query'
import { parseMetadataUrl } from './parseMetadataUrl'

type Schema = {
  [key: string]: {
    type: 'string' | 'number'
    maxLength?: number
    optional?: boolean
  }
}

type Optional<T, S extends boolean | undefined> = S extends true ? T | undefined : T

type Result<T extends Schema> = {
  [P in keyof T]: Optional<T[P]['type'] extends 'string' ? string : number, T[P]['optional']>
}

export async function fetchMetadata(uri: string) {
  return fetch(parseMetadataUrl(uri!)).then((res) => res.json())
}

export function useMetadata<T extends Schema>(uri: string | undefined, schema: T) {
  const query = useQuery(
    ['metadata', uri],
    async () => {
      const res = await fetchMetadata(uri!)

      const result: any = {}

      for (const key in schema) {
        const { maxLength, optional, type } = schema[key]
        let value = res[key]
        if (!value) {
          if (optional) continue
          return null
        }
        if (typeof value !== type) return null
        if (maxLength) value = value.slice(0, maxLength)
        result[key] = value
      }

      return result as Result<T>
    },
    {
      enabled: !!uri,
      staleTime: Infinity,
    }
  )

  return query
}
