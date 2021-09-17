export type KycStatusLabel = 'none' | 'processing' | 'updates-required' | 'verified' | 'rejected' | 'expired'

export interface KycStatus {
  isEntity?: boolean
  isUsaTaxResident?: boolean
  url?: string
  status?: KycStatusLabel
  isWhitelisted?: { [key in Tranche]: boolean }
  accredited?: boolean
  requiresSignin?: boolean
}

export type Tranche = 'senior' | 'junior'

export interface AgreementsStatus {
  name: string
  tranche: Tranche
  provider: 'docusign'
  providerTemplateId: string
  id?: string
  signed?: boolean
  counterSigned?: boolean
  declined?: boolean
  voided?: boolean
}

export interface AddressStatus {
  kyc: KycStatus
  agreements: AgreementsStatus[]
  restrictedGlobal?: boolean
  restrictedPool?: boolean
  showNonSolicitationNotice?: boolean
  linkedAddresses: string[]
}

const addressStatusPermutations: { [key: string]: AddressStatus } = {
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
