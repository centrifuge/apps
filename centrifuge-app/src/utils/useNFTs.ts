import { BN } from 'bn.js'
import { useQuery } from 'react-query'
import { firstValueFrom } from 'rxjs'
import { useCentrifuge } from '../components/CentrifugeProvider'
import { useCentrifugeQuery } from './useCentrifugeQuery'

export function useNFTs(collectionId?: string) {
  const [result] = useCentrifugeQuery(['nfts', collectionId], (cent) => cent.nfts.getCollectionNfts([collectionId!]), {
    suspense: true,
    enabled: !!collectionId,
  })

  return result
}

export function useNFT(collectionId?: string, nftId?: string, suspense = true) {
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

export function useLoanCollectionId(poolId?: string) {
  const cent = useCentrifuge()

  const { data } = useQuery(
    ['poolToLoanCollection', poolId],
    async () => {
      const collectionId = await firstValueFrom(cent.pools.getLoanCollectionIdForPool([poolId!]))
      const collateralCollectionId = new BN(collectionId).add(new BN(1)).toString()
      return {
        collectionId,
        collateralCollectionId,
      }
    },
    {
      enabled: !!poolId,
      staleTime: Infinity,
    }
  )
  return (
    data ?? {
      collectionId: undefined,
      collateralCollectionId: undefined,
    }
  )
}

export function useLoanNft(poolId?: string, loanId?: string) {
  const { collectionId } = useLoanCollectionId(poolId)
  return useNFT(collectionId, loanId, false)
}

export function useAccountNfts(address?: string, suspense = true) {
  const [result] = useCentrifugeQuery(['accountNfts', address], (cent) => cent.nfts.getAccountNfts([address!]), {
    suspense,
    enabled: !!address,
  })

  return result
}
