import React from 'react'
import { parseMetadataUrl } from './parseMetadataUrl'
import { useCentrifugeQuery } from './useCentrifugeQuery'

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

export function useMetadata<T extends Schema>(
  uri: string | string[] | undefined,
  schema?: T
): { data: Partial<Result<T>>; isLoading: boolean } {
  const [isLoading, setIsLoading] = React.useState(false)
  // this doesn't work yet
  // const { allowed } = useHostPermission(uri)
  let url: string | string[] = ''
  if (!uri) {
    uri = ''
  } else if (typeof uri === 'string') {
    url = parseMetadataUrl(uri) as string
  } else {
    url = uri.map((u) => parseMetadataUrl(u))
  }
  const [query] = useCentrifugeQuery(['metadata', url], (cent) => cent.metadata.getMetadata(url), {
    suspense: true,
    enabled: !!url || url.length > 0,
  })

  React.useEffect(() => {
    if (query) {
      setIsLoading(false)
    } else {
      setIsLoading(true)
    }
  }, [query])

  // if (!schema) return { data: query }

  // const result: any = {}

  // for (const key in schema) {
  //   const { maxLength, optional, type } = schema[key]
  //   // @ts-expect-error
  //   let value = query[key]
  //   if (!value) {
  //     if (optional) continue

  //   }
  //   if (typeof value !== type) return null
  //   if (maxLength) value = value.slice(0, maxLength)
  //   result[key] = value
  // }

  return { data: query, isLoading }
}
