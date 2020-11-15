import axios, { AxiosPromise } from 'axios';

import { ROUTES } from '@centrifuge/gateway-lib/utils/constants';
import { User } from '@centrifuge/gateway-lib/models/user';
import { Contact } from '@centrifuge/gateway-lib/models/contact';
import { FundingRequest, FundingSignatureRequest } from '@centrifuge/gateway-lib/models/funding-request';
import { TransferDetailsRequest } from '@centrifuge/gateway-lib/models/transfer-details';
import { Schema } from '@centrifuge/gateway-lib/models/schema';
import { Document } from '@centrifuge/gateway-lib/models/document';
import { MintNftRequest, TransferNftRequest } from '@centrifuge/gateway-lib/models/nfts';
import { Organization } from '@centrifuge/gateway-lib/models/organization';
const instance = axios.create();

// We reload the app when session expires but we can extend with a modal
// in the futre
instance.interceptors.response.use(response => {
  return response;
}, error => {
  if (error.response.status === 403) {
    window.location.reload()
  }
  throw error;
});



export const httpClient = {
  user: {
    login: async (user: User) => instance.post(ROUTES.USERS.login, user),
    generateToken: async (user: User) => instance.post(ROUTES.USERS.generateToken, user),
    logout: async () => instance.get(ROUTES.USERS.logout),
    register: async (user: User) => instance.post(ROUTES.USERS.base, user),
    invite: async (user: User) => instance.post(ROUTES.USERS.invite, user),
    update: async (user: User) => instance.put(ROUTES.USERS.base, user),
    delete: async (user: User) => instance.delete(`${ROUTES.USERS.base}/${user._id}`),
    list: async () => instance.get(ROUTES.USERS.base),

  },
  contacts: {
    create: async (contact: Contact) => instance.post(ROUTES.CONTACTS, contact),
    list: async () => instance.get(ROUTES.CONTACTS),
    update: async (contact: Contact) =>
      instance.put(`${ROUTES.CONTACTS}/${contact._id}`, contact),
  },
  funding: {
    create: async (fundingRequest: FundingRequest) => instance.post(ROUTES.FUNDING.base, fundingRequest),
    sign: async (fundingRequest: FundingSignatureRequest) => instance.post(ROUTES.FUNDING.sign, fundingRequest),
  },
  transferDetails: {
    create: async (transferDetails: TransferDetailsRequest) => instance.post(ROUTES.TRANSFER_DETAILS, transferDetails),
    update: async (transferDetails: TransferDetailsRequest) => instance.put(`${ROUTES.TRANSFER_DETAILS}`, transferDetails),
  },
  schemas: {
    create: async (schema: Schema) => instance.post(ROUTES.SCHEMAS, schema),
    list: async (query = {}) => instance.get(ROUTES.SCHEMAS, { params: { ...query } }),
    getById: async (id): Promise<AxiosPromise<Schema>> => instance.get(`${ROUTES.SCHEMAS}/${id}`),
    update: async (schema: Schema) => instance.put(`${ROUTES.SCHEMAS}/${schema._id}`, schema),
    archive: async (id: string) => instance.put(`${ROUTES.SCHEMAS}/${id}/archive`),
    restore: async (id: string) => instance.put(`${ROUTES.SCHEMAS}/${id}/restore`),
  },
  documents: {
    create: async (document: Document) => instance.post<Document>(ROUTES.DOCUMENTS, document),
    list: async () => instance.get(ROUTES.DOCUMENTS),
    getById: async (id): Promise<Document> => instance.get(`${ROUTES.DOCUMENTS}/${id}`),
    update: async (document: Document) => instance.put(`${ROUTES.DOCUMENTS}/${document._id}`, document),
    //TODO we should not use template as the document _id.
    clone: async (document: Document) => instance.post<Document>(`${ROUTES.DOCUMENTS}/${document.template}/clone`, document),
    commit: async (id: string) => instance.put(`${ROUTES.DOCUMENTS}/${id}/commit`),
  },
  nfts: {
    mint: async (payload: MintNftRequest) => instance.post(`${ROUTES.NFTS}/mint`, payload),
    transfer: async (payload: TransferNftRequest) => instance.post(`${ROUTES.NFTS}/transfer`, payload),
  },

  organizations: {
    create: async (organization: Organization) => instance.post(ROUTES.ORGANIZATIONS, organization),
    list: async () => instance.get(ROUTES.ORGANIZATIONS),
    update: async (organization: Organization) =>
      instance.put(`${ROUTES.ORGANIZATIONS}/${organization._id}`,organization),
  },
};
