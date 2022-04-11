import { Exclude } from 'class-transformer'
import { CoreapiNFT } from '../centrifuge-node-client'
import { PERMISSIONS } from '../utils/constants'
import { Document, DOCUMENT_ACCESS } from './document'
import { FundingAgreement } from './funding-request'

export interface IUser {
  name: string
  password?: string
  email: string
  _id?: string
  account: string
  permissions: PERMISSIONS[]
  schemas?: string[]
  enabled: boolean
  invited: boolean
}

export interface IChainAccount {
  centrifugeChainAccount: {
    id: string
    secret: string
    ss_58_address: string
  }
}

export enum TwoFaType {
  EMAIL = 'email',
  APP = 'application',
}

export type TwoFASecret = {
  ascii: string
  hex: string
  base32: string
  otpauth_url: string
}

export type LoggedInUser = {
  user: PublicUser
  token: string
}

export class User implements IUser {
  name: string = ''
  password?: string = ''
  token?: string
  email: string = ''
  _id?: string
  account: string = ''
  chain: IChainAccount
  permissions: PERMISSIONS[] = []
  schemas: string[] = []
  secret?: TwoFASecret
  // undefined acts like email in order not run migrations
  twoFAType?: TwoFaType
  enabled: boolean
  invited: boolean
}

export class PublicUser extends User {
  @Exclude()
  password?: string = ''
  @Exclude()
  token?: string
  @Exclude()
  secret?: TwoFASecret

  constructor(partial: Partial<PublicUser>) {
    super()
    Object.assign(this, partial)
  }
}

export class UserWithOrg extends User {
  organizationName?: string
}

export const canWriteToDoc = (user: { account: string } | null, doc?: Document): boolean => {
  if (!user || !doc) return false
  return accountHasDocAccess(user.account, DOCUMENT_ACCESS.WRITE, doc)
}

export const canReadDoc = (user: { account: string } | null, doc?: Document): boolean => {
  if (!user || !doc) return false
  return accountHasDocAccess(user.account, DOCUMENT_ACCESS.READ, doc)
}

export const accountHasDocAccess = (account: string, access: DOCUMENT_ACCESS, doc?: Document): boolean => {
  return !!(
    doc &&
    doc.header &&
    ((doc.header[access] &&
      Array.isArray(doc.header[access]) &&
      doc.header[access]!.find((ac) => ac.toLowerCase() === account.toLowerCase())) ||
      (doc.header.author && doc.header.author?.toLowerCase() === account.toLowerCase()))
  )
}

export const canCreateDocuments = (user: User): boolean => {
  return user.permissions.includes(PERMISSIONS.CAN_MANAGE_DOCUMENTS) && user.schemas.length > 0
}

export const canTransferNft = (user: User, nft: CoreapiNFT): boolean => {
  try {
    return user.account.toLowerCase() === nft!.owner!.toLowerCase()
  } catch (e) {
    //Just log the error
    console.log(e)
  }
  return false
}

export const canSignFunding = (user: User | null, funding?: FundingAgreement): boolean => {
  if (!user || !funding || !funding.funder_id) return false
  return String(funding.funder_id).toLowerCase() === user.account.toLowerCase()
}
