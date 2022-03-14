import { DetailedPool, Pool } from '@centrifuge/centrifuge-js'
import { useQuery } from 'react-query'
import { useCentrifuge } from '../components/CentrifugeProvider'
import { useMetadata } from './useMetadata'

export function usePools() {
  const centrifuge = useCentrifuge()
  const query = useQuery<Pool[]>(
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
  const query = useQuery<DetailedPool>(
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

export function useOrder(poolId: string, trancheId: number, address?: string) {
  const centrifuge = useCentrifuge()
  const query = useQuery(
    ['order', poolId, trancheId, address],
    async () => {
      return centrifuge.pools.getOrder([address!, poolId, trancheId])
    },
    {
      enabled: !!address,
    }
  )

  return query
}

export type PoolMetadata = {
  pool: {
    name: string
    description: string
    asset: {
      class: string
      averageMaturity: string
    }
    issuer: {
      name: string
      email: string
    }
    attributes: {
      Links: {
        'Executive Summary': string
        'Forum Discussion': string
        Website: string
      }
    }
    media: {
      logo: string
      icon: string
    }
    status: 'open' | 'upcoming' | 'hidden'
  }
  tranches: [
    {
      name: string
      symbol: string
      icon: string
    }
  ]
  riskGroups: [
    {
      id: string
      advance_rate: string
      financing_fee: string
      probability_of_default: string
      loss_given_default: string
      discount_rate: string
    }
  ]
  onboarding: {
    live: boolean
    agreements: {
      name: string
      provider: 'docusign'
      providerTemplateId: string
      tranche: string
      country: 'us | non-us'
    }[]
    issuer: {
      name: string
      email: string
      restrictedCountryCodes: string[]
      minInvestmentCurrency: number
      nonSolicitationNotice: 'all' | 'non-us' | 'none'
    }
  }
  bot: {
    channelId: string
  }
}

export function usePoolMetadata(pool?: Pool) {
  return useMetadata<PoolMetadata>(pool?.metadata)
}
