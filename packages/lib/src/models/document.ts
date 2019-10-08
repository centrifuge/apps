import { CoreapiCreateDocumentRequest, CoreapiDocumentResponse } from '../centrifuge-node-client';
import { Contact, extendContactLikeObjects } from './contact';
import { Collaborator, collaboratorsToAccessList } from './collaborator';

export interface DocumentRequest extends CoreapiCreateDocumentRequest {
  _id?: string;
}

export interface Document extends CoreapiDocumentResponse {
  ownerId?: string;
  _id?: string;
  createdAt?: Date,
  updatedAt?: Date
}

export enum DOCUMENT_ACCESS {
  READ = 'read_access',
  WRITE = 'write_access',
}

export const getDocumentCollaborators = (document: Document, contacts: Contact[]) => {
  if (!document || !document.header) return [];
  let userAccess = [];
  Object.values(DOCUMENT_ACCESS).forEach(value => {
    if (document!.header![value]) {
      userAccess = [
        ...userAccess,
        ...(document!.header![value].map(address => {
          return {
            address,
            access: value,
          };
        }) as []),
      ];
    }
  });
  return extendContactLikeObjects(userAccess, contacts);
};

export const createDocumentCollaborators = (collaborators: Collaborator[]) => {
  return Object.values(DOCUMENT_ACCESS).reduce((map, access) => {
    map[access] = collaboratorsToAccessList(collaborators, access);
    return map;
  }, {});
};


