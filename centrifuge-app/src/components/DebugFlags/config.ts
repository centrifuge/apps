import React from 'react'
import { config, isTestEnv } from '../../config'
import { ConvertAddressDialogWithButton } from './components/ConvertAddress'

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
  | 'showFinoa'
  | 'showOrderExecution'
  | 'address'
  | 'evmAddress'
  | 'batchMintNFTs'
  | 'persistDebugFlags'
  | 'showUnusedFlags'
  | 'allowInvestBelowMin'
  | 'alternativeTheme'
  | 'editPoolConfig'
  | 'editPoolVisibility'
  | 'showAdvancedAccounts'
  | 'editAdminConfig'
  | 'showPodAccountCreation'
  | 'convertAddress'
  | 'showTestNets'
  | 'showSwaps'
  | 'showOracle'
  | 'poolCreationType'
  | 'podAdminSeed'
  | 'holdersReport'
  | 'assetSnapshots'

export const flagsConfig: Record<Key, DebugFlagConfig> = {
  address: {
    default: '',
    type: 'text',
  },
  allowInvestBelowMin: {
    default: false,
    type: 'checkbox',
  },
  alternativeTheme: {
    alwaysShow: true,
    default: false,
    type: 'checkbox',
  },
  batchMintNFTs: {
    default: false,
    type: 'checkbox',
  },
  convertAddress: {
    Component: ConvertAddressDialogWithButton,
    alwaysShow: true,
    default: null,
    type: 'component',
  },
  editAdminConfig: {
    default: false,
    type: 'checkbox',
  },
  editPoolConfig: {
    default: false,
    type: 'checkbox',
  },
  editPoolVisibility: {
    default: false,
    type: 'checkbox',
  },
  evmAddress: {
    default: '',
    type: 'text',
  },
  holdersReport: {
    type: 'checkbox',
    default: false,
  },
  assetSnapshots: {
    type: 'checkbox',
    default: false,
  },
  persistDebugFlags: {
    alwaysShow: true,
    default: !!localStorage.getItem('debugFlags'),
    type: 'checkbox',
  },
  podAdminSeed: {
    default: '//Eve',
    type: 'text',
  },
  poolCreationType: {
    default: config.poolCreationType || 'immediate',
    options: {
      immediate: 'immediate',
      notePreimage: 'notePreimage',
      propose: 'propose',
    },
    type: 'select',
  },
  showAdvancedAccounts: {
    alwaysShow: true,
    default: false,
    type: 'checkbox',
  },
  showFinoa: {
    alwaysShow: true,
    default: false,
    type: 'checkbox',
  },
  showOrderExecution: {
    default: false,
    type: 'checkbox',
  },
  showPodAccountCreation: {
    default: false,
    type: 'checkbox',
  },
  showSwaps: {
    default: false,
    type: 'checkbox',
  },
  showOracle: {
    default: false,
    type: 'checkbox',
  },
  showTestNets: {
    alwaysShow: true,
    default: isTestEnv,
    type: 'checkbox',
  },
  showUnusedFlags: {
    default: false,
    type: 'checkbox',
  },
}
