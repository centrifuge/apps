const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : {})
export const debug = params.get('debug') != null

const addressStatusPermutations = {
  'Real data': null,
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
  'Verified, awaiting signature': {
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
}

export const flagsConfig = {
  address: {
    type: 'text',
    default: '',
  },
  showAll: {
    type: 'checkbox',
    default: false,
  },
  showCapacity: {
    type: 'checkbox',
    default: false,
  },
  showArchived: {
    type: 'checkbox',
    default: false,
  },
  showRewardsInfo: {
    type: 'checkbox',
    default: false,
  },
  onboardingState: {
    type: 'select',
    default: 'Real data',
    options: addressStatusPermutations,
  },
}
