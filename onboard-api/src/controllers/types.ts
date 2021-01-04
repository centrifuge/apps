export type KycStatusLabel =
  | 'none'
  | 'processing'
  | 'updates-required'
  | 'verified'
  | 'manual-review'
  | 'rejected'
  | 'expired'

export interface KycStatus {
  created?: boolean
  verified?: boolean
  us?: boolean
  url?: string
  status?: KycStatusLabel
  requiresSignin?: boolean
}

export type Tranche = 'senior' | 'junior'

// TODO: remove whether it's been created
export interface AgreementsStatus {
  name: string
  id: string
  tranche: Tranche
  signed?: boolean
  counterSigned?: boolean
}

export interface AddressStatus {
  kyc: KycStatus
  agreements: AgreementsStatus[]
}
