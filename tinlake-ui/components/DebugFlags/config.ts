import { AddressStatus } from '@centrifuge/onboarding-api/src/controllers/types'

const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : {})
export const debug = process.env.NODE_ENV === 'development' || params.get('debug') != null

const addressStatusPermutations: { [key: string]: AddressStatus | null } = {
  'Real data': null,
  'Needs Securitize link': {
    kyc: {
      url: 'https://www.google.com/',
    },
    agreements: [],
    linkedAddresses: [],
  },
  'Needs Securitize sign-in': {
    kyc: {
      requiresSignin: true,
      status: 'none',
      url: 'https://www.google.com/',
    },
    agreements: [],
    linkedAddresses: [],
  },
  'Needs to KYC': {
    kyc: {
      status: 'none',
      url: 'https://www.google.com/',
    },
    agreements: [],
    linkedAddresses: [],
  },
  'Verified, accreditation needed': {
    kyc: {
      status: 'verified',
      isUsaTaxResident: true,
      accredited: false,
    },
    agreements: [],
    showNonSolicitationNotice: true,
    linkedAddresses: [],
  },
  'Awaiting KYC, sign agreement': {
    kyc: {
      status: 'processing',
    },
    agreements: [
      {
        name: 'DROP Subscription Agreement',
        tranche: 'senior',
        provider: 'docusign',
        providerTemplateId: 'abc',
        signed: false,
        counterSigned: false,
        declined: false,
        voided: false,
      },
    ],
    showNonSolicitationNotice: true,
    linkedAddresses: [],
  },
  'Verified, awaiting counter-signature': {
    kyc: {
      status: 'verified',
    },
    agreements: [
      {
        name: 'DROP Subscription Agreement',
        tranche: 'senior',
        provider: 'docusign',
        providerTemplateId: 'abc',
        signed: true,
        counterSigned: false,
        declined: false,
        voided: false,
      },
    ],
    showNonSolicitationNotice: true,
    linkedAddresses: [],
  },
  'Voided agreement': {
    kyc: {
      status: 'verified',
    },

    agreements: [
      {
        name: 'DROP Subscription Agreement',
        tranche: 'senior',
        provider: 'docusign',
        providerTemplateId: 'abc',
        signed: false,
        counterSigned: false,
        declined: false,
        voided: true,
      },
    ],
    showNonSolicitationNotice: true,
    linkedAddresses: [],
  },
  'Declined agreement': {
    kyc: {
      status: 'verified',
    },
    agreements: [
      {
        name: 'DROP Subscription Agreement',
        tranche: 'senior',
        provider: 'docusign',
        providerTemplateId: 'abc',
        signed: false,
        counterSigned: false,
        declined: true,
        voided: false,
      },
    ],
    showNonSolicitationNotice: true,
    linkedAddresses: [],
  },
  'Counter-signed agreement, awaiting KYC': {
    kyc: {
      status: 'processing',
    },
    agreements: [
      {
        name: 'DROP Subscription Agreement',
        tranche: 'senior',
        provider: 'docusign',
        providerTemplateId: 'abc',
        signed: true,
        counterSigned: true,
        declined: false,
        voided: false,
      },
    ],
    showNonSolicitationNotice: true,
    linkedAddresses: [],
  },
  'Counter-signed agreement, KYC requires updates': {
    kyc: {
      status: 'updates-required',
    },
    agreements: [
      {
        name: 'DROP Subscription Agreement',
        tranche: 'senior',
        provider: 'docusign',
        providerTemplateId: 'abc',
        signed: true,
        counterSigned: true,
        declined: false,
        voided: false,
      },
    ],
    showNonSolicitationNotice: true,
    linkedAddresses: [],
  },
  'Counter-signed agreement, KYC rejected': {
    kyc: {
      status: 'rejected',
    },
    agreements: [
      {
        name: 'DROP Subscription Agreement',
        tranche: 'senior',
        provider: 'docusign',
        providerTemplateId: 'abc',
        signed: true,
        counterSigned: true,
        declined: false,
        voided: false,
      },
    ],
    showNonSolicitationNotice: true,
    linkedAddresses: [],
  },
  'Counter-signed agreement, KYC expired': {
    kyc: {
      status: 'expired',
    },
    agreements: [
      {
        name: 'DROP Subscription Agreement',
        tranche: 'senior',
        provider: 'docusign',
        providerTemplateId: 'abc',
        signed: true,
        counterSigned: true,
        declined: false,
        voided: false,
      },
    ],
    showNonSolicitationNotice: true,
    linkedAddresses: [],
  },
  'Country blocked for legal reasons': {
    kyc: {
      status: 'verified',
    },
    agreements: [],
    showNonSolicitationNotice: true,
    linkedAddresses: [],
    restrictedGlobal: true,
  },
  'Country blocked by issuer': {
    kyc: {
      status: 'verified',
    },
    agreements: [],
    showNonSolicitationNotice: true,
    linkedAddresses: [],
    restrictedPool: true,
  },
  'Has >1 addresses': {
    kyc: {
      status: 'verified',
    },
    agreements: [
      {
        name: 'DROP Subscription Agreement',
        tranche: 'senior',
        provider: 'docusign',
        providerTemplateId: 'abc',
        signed: true,
        counterSigned: false,
        declined: false,
        voided: false,
      },
    ],
    showNonSolicitationNotice: true,
    linkedAddresses: ['0x0A735602a357802f553113F5831FE2fbf2F0E2e0'],
  },
  Completed: {
    kyc: {
      status: 'verified',
      isWhitelisted: {
        senior: true,
        junior: false,
      },
    },
    agreements: [
      {
        name: 'DROP Subscription Agreement',
        tranche: 'senior',
        provider: 'docusign',
        providerTemplateId: 'abc',
        signed: true,
        counterSigned: true,
        declined: false,
        voided: false,
      },
    ],
    showNonSolicitationNotice: true,
    linkedAddresses: [],
  },
}

export const flagsConfig = {
  address: {
    type: 'text',
    default: params.get('address') || params.get('debug_eth_address') || '',
  },
  showAll: {
    type: 'checkbox',
    default: params.get('showAll') != null,
  },
  showCapacity: {
    type: 'checkbox',
    default: params.get('capacity') != null,
  },
  showArchived: {
    type: 'checkbox',
    default: params.get('showArchived') != null,
  },
  showRewardsInfo: {
    type: 'checkbox',
    default: params.get('debug') === 'true',
  },
  showAdmin: {
    type: 'checkbox',
    default: params.get('admin') != null,
  },
  showBorrower: {
    type: 'checkbox',
    default: params.get('borrower') != null,
  },
  showExport: {
    type: 'checkbox',
    default: params.get('export') != null,
  },
  showLockNFT: {
    type: 'checkbox',
    default: params.get('lockNFT') != null,
  },
  showTransferCurrency: {
    type: 'checkbox',
    default: params.get('transferCurrency') != null,
  },
  showCloseEpoch: {
    type: 'checkbox',
    default: params.get('show_close_epoch') != null,
  },
  allowMultipleBorrow: {
    type: 'checkbox',
    default: params.get('allowMultipleBorrow') != null,
  },
  disableInvestLimit: {
    type: 'checkbox',
    default: params.get('disableLimit') != null,
  },
  onboardingState: {
    type: 'select',
    default: 'Real data',
    options: addressStatusPermutations,
  },
  showWriteOff: {
    type: 'checkbox',
    default: params.get('writeoff') != null,
  },
  showUnusedFlags: {
    type: 'checkbox',
    default: false,
  },
}
