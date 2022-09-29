import { BN } from 'bn.js'
import { useQuery } from 'react-query'
import { firstValueFrom } from 'rxjs'
import { useCentrifuge } from '../components/CentrifugeProvider'
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

export function useAccountNfts(address?: string, suspense = true) {
  const [result] = useCentrifugeQuery(['accountNfts', address], (cent) => cent.nfts.getAccountNfts([address!]), {
    suspense,
    enabled: !!address,
  })

  return result
}
