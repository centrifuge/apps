import * as React from 'react'
import { useQuery } from 'react-query'
import { useCentrifuge } from '../components/CentrifugeProvider'
import { useCentrifugeQuery } from './useCentrifugeQuery'

export function useNFTs(collectionId?: string) {
  const cent = useCentrifuge()
  const query = useQuery(
    ['nfts', collectionId],
    async () => {
      return cent.nfts.getCollectionNfts([collectionId!])
    },
    {
      suspense: true,
      enabled: !!collectionId,
    }
  )

  return query
}

export function useNFT(collectionId?: string, nftId?: string) {
  const { data } = useNFTs(collectionId)
  return React.useMemo(() => data?.find((c) => c.id === nftId), [data, nftId])
}

export function useLoanNft(poolId?: string, loanId?: string) {
  const cent = useCentrifuge()
  const { data: collectionId } = useQuery(
    ['poolToLoanCollection', poolId],
    async () => {
      return cent.pools.getLoanCollectionIdForPool([poolId!])
    },
    {
      suspense: true,
      enabled: !!poolId,
      staleTime: Infinity,
    }
  )
  return useNFT(collectionId, loanId)
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

export function useAccountNftsRx(address?: string) {
  const [result] = useCentrifugeQuery(['accountNfts', address], (cent) => cent.nfts.getAccountNftsRx([address!]), {
    suspense: true,
    enabled: !!address,
  })

  console.log('accountnfts', result)
  return result
}
