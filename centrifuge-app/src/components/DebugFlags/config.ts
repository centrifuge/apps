import React from 'react'
import { ConvertEvmAddress } from './components/ConvertEvmAddress'

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
      type: 'component'
      Component: React.FC<{ value: any; onChange: (v: any) => void }>
      default: null
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
  | 'evmAddress'
  | 'batchMintNFTs'
  | 'persistDebugFlags'
  | 'showBase'
  | 'showUnusedFlags'
  | 'allowInvestBelowMin'
  | 'alternativeTheme'
  | 'editPoolConfig'
  | 'poolReporting'
  | 'editPoolVisibility'
  | 'showAdvancedAccounts'
  | 'editAdminConfig'
  | 'showPodAccountCreation'
  | 'convertEvmAddress'

export const flagsConfig: Record<Key, DebugFlagConfig> = {
  address: {
    type: 'text',
    default: '',
  },
  evmAddress: {
    type: 'text',
    default: '',
  },
  batchMintNFTs: {
    type: 'checkbox',
    default: false,
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
  showBase: {
    type: 'checkbox',
    default: false,
    alwaysShow: true,
  },
  editPoolConfig: {
    type: 'checkbox',
    default: false,
  },
  editAdminConfig: {
    type: 'checkbox',
    default: false,
  },
  poolReporting: {
    type: 'checkbox',
    default: false,
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
  editPoolVisibility: {
    type: 'checkbox',
    default: false,
  },
  showPodAccountCreation: {
    type: 'checkbox',
    default: false,
  },
  showAdvancedAccounts: {
    type: 'checkbox',
    default: false,
    alwaysShow: true,
  },
  convertEvmAddress: {
    type: 'component',
    Component: ConvertEvmAddress,
    default: null,
    alwaysShow: true,
  },
}
