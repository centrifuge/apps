import axios from 'axios';

// TODO: extract common models and constants in a better place (separate npm module?)
import { Invoice } from '../common/models/dto/invoice';
import { ROUTES } from '../common/constants';
import { User } from '../common/models/dto/user';
import { Contact } from '../common/models/dto/contact';

const instance = axios.create();

export const httpClient = {
  invoices: {
    create: async (invoice: Invoice) => instance.post(ROUTES.INVOICES, invoice),
    read: async () => instance.get(ROUTES.INVOICES),
  },
  user: {
    login: async (user: User) => instance.post(ROUTES.USERS.login, user),
    logout: async () => instance.get(ROUTES.USERS.logout),
  },
  contacts: {
    create: async (contact: Contact) => instance.post(ROUTES.CONTACTS, contact),
    read: async () => instance.get(ROUTES.CONTACTS),
  },
};
