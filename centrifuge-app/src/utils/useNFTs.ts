import { useCentrifugeQuery } from './useCentrifugeQuery'
import { usePool } from './usePools'

export function useNFTs(collectionId?: string) {
  const [result] = useCentrifugeQuery(['nfts', collectionId], (cent) => cent.nfts.getCollectionNfts([collectionId!]), {
    suspense: true,
    enabled: !!collectionId,
  })

  return result
}

export function useNFT(collectionId?: string | null, nftId?: string, suspense = true) {
  const [result] = useCentrifugeQuery(
    ['nft', collectionId, nftId],
    (cent) => cent.nfts.getNft([collectionId!, nftId!]),
    {
      suspense,
      enabled: !!collectionId && !!nftId,
    }
  )

  return result
}

export function useLoanNft(poolId: string, loanId?: string) {
  const pool = usePool(poolId)
  return useNFT(pool?.loanCollectionId, loanId, false)
}

export function useAccountNfts(address?: string, suspense = true) {
  const [result] = useCentrifugeQuery(['accountNfts', address], (cent) => cent.nfts.getAccountNfts([address!]), {
    suspense,
    enabled: !!address,
  })

  return result
}
