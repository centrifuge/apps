import { useCentrifugeQuery } from './useCentrifugeQuery'
import { useMetadata } from './useMetadata'

export function usePools() {
  const [result] = useCentrifugeQuery(['pools'], (cent) => cent.pools.getPools(), {
    suspense: true,
  })

  return result
}

export function usePool(id: string) {
  const [result] = useCentrifugeQuery(['pool', id], (cent) => cent.pools.getPool([id]), {
    suspense: true,
  })

  return result
}

export function useOrder(poolId: string, trancheId: number, address?: string) {
  const [result] = useCentrifugeQuery(
    ['order', poolId, trancheId, address],
    (cent) => cent.pools.getOrder([address!, poolId, trancheId]),
    {
      enabled: !!address,
    }
  )

  return result
}

export function usePendingCollect(poolId: string, trancheId: number, address?: string) {
  const [result] = useCentrifugeQuery(
    ['pendingCollect', poolId, trancheId, address],
    (cent) => cent.pools.getPendingCollect([address!, poolId, trancheId]),
    {
      enabled: !!address,
    }
  )

  return result
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

export function usePoolMetadata(pool?: { metadata?: string }) {
  return useMetadata<PoolMetadata>(pool?.metadata)
}
