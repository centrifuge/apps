import { PERMISSIONS } from '../constants';
import { Document, DOCUMENT_ACCESS } from './document';

export interface IUser {
  name: string;
  password?: string;
  email: string;
  _id?: string;
  account: string;
  permissions: PERMISSIONS[];
  schemas?: string[];
  enabled: boolean;
  invited: boolean;
}

export class User implements IUser {
  name: string = '';
  password?: string = '';
  email: string = '';
  _id?: string;
  account: string = '';
  permissions: PERMISSIONS[] = [];
  schemas: string[] = [];
  enabled: boolean;
  invited: boolean;
}

export const canWriteToDoc = (user: User | null, doc?: Document): boolean => {
  if(!user || !doc) return false;
  return accountHasDocAccess(user.account, DOCUMENT_ACCESS.WRITE, doc);
};

export const canReadDoc = (user: User | null, doc?: Document): boolean => {
  if(!user || !doc) return false;
  return accountHasDocAccess(user.account, DOCUMENT_ACCESS.READ, doc);
};

export const accountHasDocAccess = (account: string, access: DOCUMENT_ACCESS, doc?: Document): boolean => {
  return !!(
    doc &&
    doc.header &&
    doc.header[access] &&
    Array.isArray(doc.header[access]) &&
    doc.header[access]!.find(
      ac => ac.toLowerCase() === account.toLowerCase(),
    )
  );
};


export const canCreateDocuments = (user: User): boolean => {
  return (
    user.permissions.includes(PERMISSIONS.CAN_MANAGE_DOCUMENTS)
    && user.schemas.length > 0);
};


export const canSignFunding = (user:User | null, doc?:Document):boolean => {
  if(!user) return false;
  return !!(
    doc &&
    doc.attributes &&
    doc.attributes.funding_agreement &&
    Array.isArray(doc.attributes.funding_agreement) &&
    doc.attributes.funding_agreement!.find(
      funding => {
        return funding.funder_id && funding.funder_id.value.toLowerCase() === user.account.toLowerCase()
      },
    )
  );
}
