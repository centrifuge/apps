import { CoreapiDocumentResponse, V2CreateDocumentRequest } from '../centrifuge-node-client'
import { Collaborator, collaboratorsToAccessList } from './collaborator'
import { Contact, extendContactLikeObjects } from './contact'

export interface DocumentRequest extends V2CreateDocumentRequest {
  _id?: string
}

export interface Document extends CoreapiDocumentResponse {
  ownerId?: string
  organizationId?: string
  _id?: string
  fromId?: string
  createdAt?: Date
  updatedAt?: Date
  document_id?: string
  nft_status?: string
  document_status?: string
  template?: string
}

export enum DOCUMENT_ACCESS {
  READ = 'read_access',
  WRITE = 'write_access',
}

export enum DocumentStatus {
  Creating = 'Creating',
  Created = 'Created',
  CreationFail = 'Document creation failed',
}

export enum NftStatus {
  Minting = 'Minting',
  Minted = 'Minted',
  MintingFail = 'NFT minting failed',
  NoNft = 'No NFT minted',
}

export const documentHasNFTs = (document: Document) => {
  return document.header?.nfts && document.header?.nfts.length > 0
}

export const documentIsEditable = (document: Document) => {
  return (
    (document.nft_status === NftStatus.NoNft || document.nft_status === NftStatus.MintingFail) &&
    (document.document_status === DocumentStatus.Created || document.document_status === DocumentStatus.CreationFail)
  )
}

export const getDocumentCollaborators = (document: Document, contacts: Contact[]) => {
  if (!document || !document.header) return []
  let userAccess = []
  Object.values(DOCUMENT_ACCESS).forEach((value) => {
    if (document!.header![value]) {
      userAccess = [
        ...userAccess,
        ...(document!.header![value]!.map((address) => {
          return {
            address,
            access: value,
          }
        }) as []),
      ]
    }
  })
  return extendContactLikeObjects(userAccess, contacts)
}

export const createDocumentCollaborators = (collaborators: Collaborator[]) => {
  return Object.values(DOCUMENT_ACCESS).reduce((map, access) => {
    map[access] = collaboratorsToAccessList(collaborators, access)
    return map
  }, {})
}

export const canLoadDocument = (document: Document) => {
  return document._id && document.document_status !== DocumentStatus.Creating
}
