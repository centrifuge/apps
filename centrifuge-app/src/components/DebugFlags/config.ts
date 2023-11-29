import React from 'react'
import { config, isTestEnv } from '../../config'
import { ConvertAddress } from './components/ConvertAddress'

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
  | 'showArbitrum'
  | 'showUnusedFlags'
  | 'allowInvestBelowMin'
  | 'alternativeTheme'
  | 'editPoolConfig'
  | 'editPoolVisibility'
  | 'showAdvancedAccounts'
  | 'editAdminConfig'
  | 'showPodAccountCreation'
  | 'convertAddress'
  | 'showPortfolio'
  | 'showTestNets'
  | 'showSwaps'
  | 'showPrime'
  | 'poolCreationType'
  | 'podAdminSeed'

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
  showArbitrum: {
    type: 'checkbox',
    default: false,
    alwaysShow: true,
  },
  showTestNets: {
    type: 'checkbox',
    default: isTestEnv,
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
  convertAddress: {
    type: 'component',
    Component: ConvertAddress,
    default: null,
    alwaysShow: true,
  },
  showPortfolio: {
    type: 'checkbox',
    default: false,
  },
  showSwaps: {
    type: 'checkbox',
    default: false,
  },
  showPrime: {
    type: 'checkbox',
    default: false,
    alwaysShow: true,
  },
  poolCreationType: {
    type: 'select',
    default: config.poolCreationType || 'immediate',
    options: {
      immediate: 'immediate',
      propose: 'propose',
      notePreimage: 'notePreimage',
    },
  },
  podAdminSeed: {
    type: 'text',
    default: '//Eve',
  },
}
