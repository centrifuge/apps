import * as React from 'react'
import { useQuery } from 'react-query'
import { useCentrifuge } from '../components/CentrifugeProvider'
import { useCentrifugeQuery } from './useCentrifugeQuery'

export function useNFTs(collectionId?: string) {
  const [result] = useCentrifugeQuery(['nfts', collectionId], (cent) => cent.nfts.getCollectionNfts([collectionId!]), {
    suspense: true,
    enabled: !!collectionId,
  })

  console.log('nfts', result)
  return result
}

export function useNFT(collectionId?: string, nftId?: string) {
  const nfts = useNFTs(collectionId)
  return React.useMemo(() => nfts?.find((c) => c.id === nftId), [nfts, nftId])
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
  const [result] = useCentrifugeQuery(['accountNfts', address], (cent) => cent.nfts.getAccountNfts([address!]), {
    suspense,
    enabled: !!address,
  })

  console.log('accountnfts', result)
  return result
}
