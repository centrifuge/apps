const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : {})
export const debug =
  import.meta.env.MODE === 'development' || params.get('debug') != null || !!localStorage.getItem('debug')

export type DebugFlagConfig =
  | {
      type: 'text'
      default: string
    }
  | {
      type: 'checkbox'
      default: boolean
    }
  | {
      type: 'select'
      default: string
      options: Record<string, any>
    }

export type Key = 'address' | 'batchMintNFTs' | 'alwaysShowPanel' | 'showUnusedFlags' | 'showAdditionalIssuerTabs'

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
    default: false,
  },
}
