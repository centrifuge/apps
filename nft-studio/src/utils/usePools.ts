import { Pool } from '@centrifuge/centrifuge-js'
import { useQuery } from 'react-query'
import { useCentrifuge } from '../components/CentrifugeProvider'
import { useMetadata } from './useMetadata'

export function usePools() {
  const centrifuge = useCentrifuge()
  const query = useQuery(
    ['pools'],
    async () => {
      return centrifuge.pools.getPools()
    },
    {
      suspense: true,
    }
  )

  return query
}

export function usePool(id: string) {
  const centrifuge = useCentrifuge()
  const query = useQuery(
    ['pool', id],
    async () => {
      return centrifuge.pools.getPool([id])
    },
    {
      suspense: true,
    }
  )

  return query
}

type PoolMetadata = {
  metadata: {
    name: string
    asset: string
    description: string
    media: {
      logo: string
    }
    attributes: {
      Issuer?: string
      Links: {
        [key: string]: string
      }
    }
  }
}

export function usePoolMetadata(pool?: Pool) {
  return useMetadata<PoolMetadata>(pool?.metadata)
}
