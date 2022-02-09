const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : {})
export const debug =
  process.env.NODE_ENV === 'development' || params.get('debug') != null || !!localStorage.getItem('debug')

type DebugFlagConfig = {
  type: string
  default: boolean | string | number
  options?: Record<string, unknown>
}

export const flagsConfig: Record<string, DebugFlagConfig> = {
  address: {
    type: 'text',
    default: '',
  },
  showOnlyNFT: {
    type: 'checkbox',
    default: true,
  },
  alwaysShowPanel: {
    type: 'checkbox',
    default: !!localStorage.getItem('debug'),
  },
  showUnusedFlags: {
    type: 'checkbox',
    default: false,
  },
}
