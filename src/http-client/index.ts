import axios from 'axios';

// TODO: extract common models and constants in a better place (separate npm module?)
import { Invoice } from '../common/models/invoice';
import { ROUTES } from '../common/constants';
import { User } from '../common/models/user';
import { Contact } from '../common/models/contact';
import {
  InvoiceInvoiceResponse,
} from '../../clients/centrifuge-node';

const instance = axios.create();

export const httpClient = {
  invoices: {
    create: async (invoice: Invoice): Promise<InvoiceInvoiceResponse> =>
      instance.post(ROUTES.INVOICES, invoice),
    update: async (invoice: Invoice): Promise<InvoiceInvoiceResponse> =>
      instance.put(`${ROUTES.INVOICES}/${invoice._id}`, invoice),
    read: async (): Promise<InvoiceInvoiceResponse> =>
      instance.get(ROUTES.INVOICES),
    readById: async (id): Promise<InvoiceInvoiceResponse> =>
      instance.get(`${ROUTES.INVOICES}/${id}`),
  },
  user: {
    login: async (user: User) => instance.post(ROUTES.USERS.login, user),
    logout: async () => instance.get(ROUTES.USERS.logout),
    register: async(user: User) => instance.post(ROUTES.USERS.register, user),
    invite: async(user: User) => instance.post(ROUTES.USERS.invite, user),
    list: async () => instance.get(ROUTES.USERS.base)

  },
  contacts: {
    create: async (contact: Contact) => instance.post(ROUTES.CONTACTS, contact),
    read: async () => instance.get(ROUTES.CONTACTS),
    update: async (contact: Contact) =>
      instance.put(`${ROUTES.CONTACTS}/${contact._id}`, contact),
  }
};
