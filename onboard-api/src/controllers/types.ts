export interface KycStatus {
  created?: boolean
  verified?: boolean
  url?: string
}

// TODO: remove whether it's been created
export interface AgreementsStatus {
  name: string
  id: string
  signed?: boolean
  counterSigned?: boolean
}

export interface AddressStatus {
  kyc: KycStatus
  agreements: AgreementsStatus[]
}
