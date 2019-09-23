import axios from 'axios';

import { ROUTES } from '../common/constants';
import { User } from '../common/models/user';
import { Contact } from '../common/models/contact';
import { FunRequest } from '../../clients/centrifuge-node';
import { FundingRequest } from '../common/models/funding-request';
import { TransferDetailsRequest } from '../common/models/transfer-details';
import { Schema } from '../common/models/schema';
import { Document, MintNftRequest } from '../common/models/document';

const instance = axios.create();

export const httpClient = {
  user: {
    login: async (user: User) => instance.post(ROUTES.USERS.login, user),
    logout: async () => instance.get(ROUTES.USERS.logout),
    register: async (user: User) => instance.post(ROUTES.USERS.base, user),
    invite: async (user: User) => instance.post(ROUTES.USERS.invite, user),
    update: async (user: User) => instance.put(ROUTES.USERS.base, user),
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
    sign: async (fundingRequest: FunRequest) => instance.post(ROUTES.FUNDING.sign, fundingRequest),
  },
  transferDetails: {
    create: async (transferDetails: TransferDetailsRequest) => instance.post(ROUTES.TRANSFER_DETAILS, transferDetails),
    update: async (transferDetails: TransferDetailsRequest) => instance.put(`${ROUTES.TRANSFER_DETAILS}`, transferDetails),
  },
  schemas: {
    create: async (schema: Schema) => instance.post(ROUTES.SCHEMAS, schema),
    list: async (query = {}) => instance.get(ROUTES.SCHEMAS, { params: { ...query } }),
    getById: async (id): Promise<Schema> => instance.get(`${ROUTES.SCHEMAS}/${id}`),
    update: async (schema: Schema) => instance.put(`${ROUTES.SCHEMAS}/${schema._id}`, schema),
    archive: async (id: string) => instance.delete(`${ROUTES.SCHEMAS}/${id}`),
  },
  documents: {
    create: async (document: Document) => instance.post(ROUTES.DOCUMENTS, document),
    list: async () => instance.get(ROUTES.DOCUMENTS),
    getById: async (id): Promise<Document> => instance.get(`${ROUTES.DOCUMENTS}/${id}`),
    update: async (document: Document) => instance.put(`${ROUTES.DOCUMENTS}/${document._id}`, document),
    mint: async (id: string | undefined, payload: MintNftRequest) => instance.post(`${ROUTES.DOCUMENTS}/${id}/mint`, payload),
  },
};
