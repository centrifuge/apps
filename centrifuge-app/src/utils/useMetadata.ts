import Centrifuge from '@centrifuge/centrifuge-js'
import { useCentrifuge } from '@centrifuge/centrifuge-react'
import { useCallback } from 'react'
import { useQueries, useQuery, useQueryClient, UseQueryResult } from 'react-query'
import { lastValueFrom } from 'rxjs'

type Schema = {
  [key: string]: {
    type: 'string' | 'number' | 'any'
    maxLength?: number
    optional?: boolean
  }
}

type Optional<T, S extends boolean | undefined> = S extends true ? T | undefined : T

type Result<T extends Schema> = {
  [P in keyof T]: Optional<
    T[P]['type'] extends 'string' ? string : T[P]['type'] extends 'any' ? any : number,
    T[P]['optional']
  >
}

export async function metadataQueryFn<T extends Schema>(uri: string, cent: Centrifuge, schema?: T) {
  try {
    const res = await lastValueFrom(cent.metadata.getMetadata(uri!))

    if (!schema) return res

    const result: any = {}

    for (const key in schema) {
      const { maxLength, optional, type } = schema[key]
      let value = res[key]
      if (!value) {
        if (!optional) return null
      } else {
        if (typeof value !== type && type !== 'any') return null
        if (maxLength) value = value.slice(0, maxLength)
      }
      result[key] = value
    }

    return result as Result<T>
  } catch (error) {
    console.error('Metadata query error', error)
  }
}

export function useMetadata<T = any>(uri: string | undefined): UseQueryResult<Partial<T>, unknown>
export function useMetadata<T extends Schema>(uri: string | undefined, schema: T): UseQueryResult<Result<T>, unknown>
export function useMetadata<T extends Schema>(uri: string | undefined, schema?: T) {
  const cent = useCentrifuge()
  const { data, isLoading } = useQuery(['metadata', uri], async () => metadataQueryFn(uri!, cent, schema), {
    enabled: !!uri,
    staleTime: Infinity,
  })

  return { data, isLoading }
}

export function usePrefetchMetadata() {
  const cent = useCentrifuge()
  const queryClient = useQueryClient()

  return useCallback((uri: string) => {
    queryClient.prefetchQuery(['metadata', uri], () => metadataQueryFn(uri, cent))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

export function useMetadataMulti<T = any>(uris: (string | undefined)[]): UseQueryResult<Partial<T>, unknown>[]
export function useMetadataMulti<T extends Schema>(
  uris: (string | undefined)[],
  schema: T
): UseQueryResult<Result<T>, unknown>[]
export function useMetadataMulti<T extends Schema>(uris: (string | undefined)[], schema?: T) {
  const cent = useCentrifuge()
  const queries = useQueries(
    uris?.map((uri) => {
      return {
        queryKey: ['metadata', uri],
        queryFn: async () => metadataQueryFn(uri!, cent, schema),
        enabled: !!uri,
        staleTime: Infinity,
      }
    })
  )

  return queries
}
