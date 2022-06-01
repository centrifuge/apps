const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : {})
export const debug =
  import.meta.env.MODE === 'development' || params.get('debug') != null || !!localStorage.getItem('debugFlags')

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
  | 'persistDebugFlags'
  | 'showUnusedFlags'
  | 'showAdditionalIssuerTabs'
  | 'allowInvestBelowMin'
  | 'alternativeTheme'
  | 'editPoolConfig'

export const flagsConfig: Record<Key, DebugFlagConfig> = {
  address: {
    type: 'text',
    default: '',
  },
  batchMintNFTs: {
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
  alternativeTheme: {
    type: 'checkbox',
    default: false,
    alwaysShow: true,
  },
  editPoolConfig: {
    type: 'checkbox',
    default: false,
    alwaysShow: true,
  },
  persistDebugFlags: {
    type: 'checkbox',
    default: !!localStorage.getItem('debugFlags'),
    alwaysShow: true,
  },
  showUnusedFlags: {
    type: 'checkbox',
    default: false,
  },
}
