import axios from 'axios';
// TODO: extract common models and constants in a better place (separate npm module?)
import { Invoice } from '../common/models/invoice';
import { ROUTES } from '../common/constants';
import { User } from '../common/models/user';
import { Contact } from '../common/models/contact';
import { FunRequest, InvInvoiceResponse } from '../../clients/centrifuge-node';
import { FundingRequest } from '../common/models/funding-request';
import { TransferDetailsRequest } from '../common/models/transfer-details';
import { Schema } from "../common/models/schema";

const instance = axios.create();

export const httpClient = {
  invoices: {
    create: async (invoice: Invoice): Promise<InvInvoiceResponse> =>
      instance.post(ROUTES.INVOICES, invoice),
    update: async (invoice: Invoice): Promise<InvInvoiceResponse> =>
      instance.put(`${ROUTES.INVOICES}/${invoice._id}`, invoice),
    read: async (): Promise<InvInvoiceResponse> =>
      instance.get(ROUTES.INVOICES),
    readById: async (id): Promise<InvInvoiceResponse> =>
      instance.get(`${ROUTES.INVOICES}/${id}`),
  },
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
    read: async () => instance.get(ROUTES.CONTACTS),
    update: async (contact: Contact) =>
      instance.put(`${ROUTES.CONTACTS}/${contact._id}`, contact),
  },
  funding: {
    create: async (fundingRequest: FundingRequest) => instance.post(ROUTES.FUNDING.base, fundingRequest),
    sign: async (fundingRequest: FunRequest) => instance.post(ROUTES.FUNDING.sign, fundingRequest),
    settle: async (fundingRequest: FundingRequest) => instance.post(ROUTES.FUNDING.settle, fundingRequest),
  },
  transferDetails: {
    create: async (transferDetails: TransferDetailsRequest) => instance.post(ROUTES.TRANSFER_DETAILS, transferDetails),
    update: async (transferDetails: TransferDetailsRequest) => instance.put(`${ROUTES.TRANSFER_DETAILS}`, transferDetails),
  },
  schemas : {
    create: async (schema: Schema) => instance.post(ROUTES.SCHEMAS, schema),
    read: async () => instance.get(ROUTES.SCHEMAS),
    readById: async (id): Promise<Schema> => instance.get(`${ROUTES.SCHEMAS}/${id}`),
    update: async (schema: Schema) => instance.put(`${ROUTES.SCHEMAS}/${schema._id}`, schema),
  }
};
