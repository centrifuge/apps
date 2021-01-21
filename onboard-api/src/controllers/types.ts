export type KycStatusLabel = 'none' | 'processing' | 'updates-required' | 'verified' | 'rejected' | 'expired'

export interface KycStatus {
  isUsaTaxResident?: boolean
  url?: string
  status?: KycStatusLabel
  isWhitelisted?: { [key in Tranche]: boolean }
  accredited?: boolean
  requiresSignin?: boolean
}

export type Tranche = 'senior' | 'junior'

// TODO: remove whether it's been created
export interface AgreementsStatus {
  name: string
  tranche: Tranche
  provider: 'docusign'
  providerTemplateId: string
  id?: string
  signed?: boolean
  counterSigned?: boolean
}

export interface AddressStatus {
  kyc: KycStatus
  agreements: AgreementsStatus[]
}
