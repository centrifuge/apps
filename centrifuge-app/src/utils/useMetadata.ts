import { useRef } from 'react'
import { parseMetadataUrl } from './parseMetadataUrl'
import { useCentrifugeQuery } from './useCentrifugeQuery'

type Schema = {
  [key: string]: {
    type: 'string' | 'number'
    maxLength?: number
    optional?: boolean
  }
}

export function useMetadata<T extends Record<any, any>>(
  uri: string | string[] | undefined,
  schema?: Schema
): { data: T } {
  const dataRef = useRef<T | Record<any, any>>({})
  // this doesn't work yet
  // const { allowed } = useHostPermission(uri)
  let url: string | string[] = ''
  if (!uri) {
    url = ''
  } else if (typeof uri === 'string') {
    url = parseMetadataUrl(uri) as string
  } else {
    url = uri.map((u) => parseMetadataUrl(u))
  }
  const [result] = useCentrifugeQuery(['metadata', url], (cent) => cent.metadata.getMetadata(url), {
    suspense: true,
    enabled: !!url || url.length > 0,
  })

  if (!schema) {
    return { data: result }
  }

  const resultSchema: any = {}
  if (schema && result && dataRef) {
    for (const key in schema) {
      const { maxLength, optional, type } = schema[key]
      let value = result[key]
      if (!value) {
        if (optional) continue
        continue
      }
      if (typeof value !== type) continue
      if (maxLength) value = value.slice(0, maxLength)
      resultSchema[key] = value
    }
  }
  return { data: resultSchema || result }
}
