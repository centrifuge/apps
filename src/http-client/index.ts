import axios from 'axios';

// TODO: extract common models and constants in a better place (separate npm module?)
import { Invoice } from '../common/models/dto/invoice';
import { ROUTES } from '../common/constants';
import { User } from '../common/models/dto/user';
import { Contact } from '../common/models/dto/contact';
import {
  InvoiceInvoiceResponse,
  PurchaseorderPurchaseOrderResponse,
} from '../../clients/centrifuge-node/generated-client';
import { PurchaseOrder } from '../common/models/dto/purchase-order';

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
  },
  contacts: {
    create: async (contact: Contact) => instance.post(ROUTES.CONTACTS, contact),
    read: async () => instance.get(ROUTES.CONTACTS),
  },
  purchaseOrders: {
    create: async (
      purchaseOrder: PurchaseOrder,
    ): Promise<PurchaseorderPurchaseOrderResponse> =>
      instance.post(ROUTES.PURCHASE_ORDERS, purchaseOrder),
    update: async (
      purchaseOrder: PurchaseOrder,
    ): Promise<PurchaseorderPurchaseOrderResponse> =>
      instance.put(
        `${ROUTES.PURCHASE_ORDERS}/${purchaseOrder._id}`,
        purchaseOrder,
      ),
    read: async (): Promise<PurchaseorderPurchaseOrderResponse> =>
      instance.get(ROUTES.PURCHASE_ORDERS),
    readById: async (id): Promise<PurchaseorderPurchaseOrderResponse> =>
      instance.get(`${ROUTES.PURCHASE_ORDERS}/${id}`),
  },
};
