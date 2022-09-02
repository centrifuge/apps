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
