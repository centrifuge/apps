const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : {})
export const debug =
  import.meta.env.MODE === 'development' || params.get('debug') != null || !!localStorage.getItem('debug')

export type DebugFlagConfig =
  | {
      type: 'text'
      default: string
      alwaysShow?: boolean
    }
  | {
      type: 'checkbox'
      default: boolean
      alwaysShow?: boolean
    }
  | {
      type: 'select'
      default: string
      options: Record<string, any>
      alwaysShow?: boolean
    }

export type Key =
  | 'address'
  | 'batchMintNFTs'
  | 'alwaysShowPanel'
  | 'showUnusedFlags'
  | 'showAdditionalIssuerTabs'
  | 'allowInvestBelowMin'
  | 'altairDarkMode'
  | 'showProxies'

export const flagsConfig: Record<Key, DebugFlagConfig> = {
  address: {
    type: 'text',
    default: '',
  },
  batchMintNFTs: {
    type: 'checkbox',
    default: false,
  },
  alwaysShowPanel: {
    type: 'checkbox',
    default: !!localStorage.getItem('debug'),
  },
  showUnusedFlags: {
    type: 'checkbox',
    default: false,
  },
  showAdditionalIssuerTabs: {
    type: 'checkbox',
    default: true,
  },
  allowInvestBelowMin: {
    type: 'checkbox',
    default: false,
  },
  altairDarkMode: {
    type: 'checkbox',
    default: false,
    alwaysShow: true,
  },
  showProxies: {
    type: 'checkbox',
    default: false,
  },
}
