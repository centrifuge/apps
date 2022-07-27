import { first, from, Observable } from 'rxjs'
import Centrifuge from '..'
interface TrancheFormValues {
  tokenName: string
  symbolName: string
  interestRate: number | ''
  minRiskBuffer: number | ''
  minInvestment: number | ''
}
interface RiskGroupFormValues {
  groupName: string
  advanceRate: number | ''
  fee: number | ''
  probabilityOfDefault: number | ''
  lossGivenDefault: number | ''
  discountRate: number | ''
}
interface WriteOffGroupFormValues {
  days: number | ''
  writeOff: number | ''
}

export interface PoolMetadataInput {
  // details
  poolIcon: string | null
  poolName: string
  assetClass: string
  currency: string
  maxReserve: number | ''
  epochHours: number | ''
  epochMinutes: number | ''

  // issuer
  issuerName: string
  issuerLogo: string | null
  issuerDescription: string

  executiveSummary: string | null
  website: string
  forum: string
  email: string

  // tranche
  tranches: TrancheFormValues[]
  riskGroups: RiskGroupFormValues[]
  writeOffGroups: WriteOffGroupFormValues[]
}

export type PoolStatus = 'open' | 'upcoming' | 'hidden'
export type PoolCountry = 'us' | 'non-us'
export type NonSolicitationNotice = 'all' | 'non-us' | 'none'
export type PoolMetadata = {
  pool: {
    name: string
    icon: string
    asset: {
      class: string
    }
    issuer: {
      name: string
      description: string
      email: string
      logo: string
    }
    links: {
      executiveSummary: string
      forum: string
      website: string
    }
    status: PoolStatus
  }
  tranches: Record<
    string,
    {
      name: string
      symbol: string
      minInitialInvestment: string
    }
  >
  riskGroups: {
    name: string | undefined
    advanceRate: string
    interestRatePerSec: string
    probabilityOfDefault: string
    lossGivenDefault: string
    discountRate: string
  }[]
  // Not yet implemented
  // onboarding: {
  //   live: boolean
  //   agreements: {
  //     name: string
  //     provider: 'docusign'
  //     providerTemplateId: string
  //     tranche: string
  //     country: 'us | non-us'
  //   }[]
  //   issuer: {
  //     name: string
  //     email: string
  //     restrictedCountryCodes: string[]
  //     minInvestmentCurrency: number
  //     nonSolicitationNotice: 'all' | 'non-us' | 'none'
  //   }
  // }
  // bot: {
  //   channelId: string
  // }
}

export function getMetadataModule(inst: Centrifuge) {
  function getMetadata<T = any>(uri: string): Observable<T | T[] | null> {
    const url = parseMetadataUrl(uri)
    if (!url) {
      return from([])
    }
    return inst.getMetadataObservable<T>(url)
  }

  function pinFile(metadata: any): Observable<{ uri: string; ipfsHash: string }> {
    if (!inst.config?.pinFile) {
      console.error('pinFile must be set in config to use this feature')
      return from([])
    }
    return from(
      inst.config.pinFile({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(metadata),
      })
    ).pipe(first())
  }

  function pinJson(metadata: any): Observable<{ uri: string; ipfsHash: string }> {
    if (!inst.config.pinJson) {
      console.error('pinJson must be set in config to use this feature')
      return from([])
    }
    return from(
      inst.config.pinJson({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(metadata),
      })
    ).pipe(first())
  }

  function parseMetadataUrl(url: string) {
    try {
      let newUrl

      if (!url.includes(':')) {
        // string without protocol is assumed to be an IPFS hash
        newUrl = new URL(`ipfs/${url}`, inst.config.metadataHost)
      } else if (url.startsWith('ipfs://')) {
        newUrl = new URL(url.substr(7), inst.config.metadataHost)
      } else {
        newUrl = new URL(url)
      }

      if (newUrl.protocol === 'http:' || newUrl.protocol === 'https:') {
        return newUrl.href
      }

      return ''
    } catch (e) {
      return ''
    }
  }

  return { getMetadata, parseMetadataUrl, pinFile, pinJson }
}
