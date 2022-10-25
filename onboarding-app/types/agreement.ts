type KycStatusLabel = 'none' | 'processing' | 'updates-required' | 'verified' | 'rejected' | 'expired'

interface SecuritizeDigest {
  accessToken: string
  refreshToken: string
  expiration: string
}

type Agreement = {
  id: string
  userId: string
  poolId: string
  tranche: Tranche
  name: string
  provider: 'docusign'
  providerTemplateId: string
  providerEnvelopeId: string
  signedAt: Date
  counterSignedAt: Date
  declinedAt?: Date
  voidedAt?: Date
}

type Tranche = 'senior' | 'junior'

type User = {
  id: string
  email?: string
  fullName?: string
  entityName?: string
  countryCode?: string
}

interface KycEntity {
  userId: string
  provider: string
  providerAccountId: string
  poolId?: string
  digest: SecuritizeDigest
  createdAt?: Date
  status: KycStatusLabel
  accredited: boolean
  usaTaxResident: boolean
  invalidatedAt?: boolean
}

export type AgreementMap = { [key: string]: { agreements: Agreement[]; user: UserWithKyc }[] }

// @ts-ignore
type UserWithKyc = Omit<KycEntity, 'digest'> & User
