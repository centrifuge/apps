import { encodeAddress } from '@polkadot/keyring'
import * as React from 'react'
import { useQuery } from 'react-query'
import { useWeb3 } from '../components/Web3Provider'
import { initPolkadotApi } from './web3'

type CollectionValue = {
  // owner: string
  // issuer: string
  admin: string
  // freezer: string
  // totalDeposit: u128
  // freeHolding: boolean
  instances: number
  // instanceMetadatas: u32
  // attributes: u32
  // isFrozen: boolean
}

export type Collection = CollectionValue & {
  id: string
  metadataUri?: string
}

export function useCollections() {
  const query = useQuery(['collections'], async () => {
    const api = await initPolkadotApi()

    const [metas, collections] = await Promise.all([
      api.query.uniques.classMetadataOf.entries(),
      api.query.uniques.class.entries(),
    ])

    const metasObj = metas.reduce((acc, [keys, value]) => {
      acc[keys.toJSON()[0]] = value.toHuman()
      return acc
    }, {} as any)

    const mapped = collections.map(([keys, value]) => {
      const id = keys.toJSON()[0]
      const collectionValue = value.toJSON() as any as CollectionValue
      const collection: Collection = {
        id,
        admin: encodeAddress(collectionValue.admin),
        instances: collectionValue.instances,
        metadataUri: metasObj[id]?.data,
      }
      return collection
    })
    console.log('collections', collections, metas, mapped)
    return mapped
  })

  return query
}

export function useUserCollections(addressOverride?: string) {
  const { selectedAccount } = useWeb3()
  const address = addressOverride || selectedAccount?.address
  const { data } = useCollections()

  return React.useMemo(() => data?.filter((c) => c.admin === address), [data, address])
}

export type CollectionMetaData = {
  name: string
  description: string
}

export function useCollectionMetadata(id: string) {
  const { data } = useCollections()

  const query = useQuery(
    ['collectionMetadata', id],
    async () => {
      const collection = data!.find((c) => c.id === id)
      if (!collection || !collection.metadataUri) return null
      const res = await fetch(collection.metadataUri).then((res) => res.json())
      if (typeof res.name !== 'string' || typeof res.description !== 'string') {
        throw new Error('collectionMetadata: Invalid format')
      }
      return {
        name: res.name,
        description: res.description,
      }
    },
    {
      enabled: !!data,
    }
  )

  return query
}
