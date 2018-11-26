import axios from 'axios';

// TODO: extract common models and constants in a better place (separate npm module?)
import { Invoice } from '../common/models/dto/invoice';
import { ROUTES } from '../common/constants';

export const httpClient = {
  invoices: {
    create: async (invoice: Invoice) =>
      axios.post(ROUTES.INVOICES, invoice),
    read: async () => axios.get(ROUTES.INVOICES),
  },
};
