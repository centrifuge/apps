export interface KycStatus {
  created?: boolean
  verified?: boolean
  us?: boolean
  url?: string
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
