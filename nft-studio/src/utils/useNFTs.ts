import * as React from 'react'
import { useQuery } from 'react-query'
import { useCentrifuge } from '../components/CentrifugeProvider'

export function useNFTs(collectionId: string) {
  const cent = useCentrifuge()
  const query = useQuery(
    ['nfts', collectionId],
    async () => {
      return cent.nfts.getCollectionNfts([collectionId])
    },
    {
      suspense: true,
    }
  )

  return query
}

export function useNFT(collectionId: string, nftId: string) {
  const { data } = useNFTs(collectionId)
  return React.useMemo(() => data?.find((c) => c.id === nftId), [data, nftId])
}

export function useAccountNfts(address?: string, suspense = true) {
  const cent = useCentrifuge()
  const query = useQuery(
    ['accountNfts', address],
    async () => {
      return cent.nfts.getAccountNfts([address!])
    },
    {
      suspense,
      enabled: !!address,
    }
  )

  return query
}
