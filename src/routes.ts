import invoiceRoutes from './invoices/routes';
import purchaseOrdersRoutes from './purchaseorders/routes';
import contactsRoutes from './contacts/routes';
import userRoutes from './user/routes';

export default {
  invoices: invoiceRoutes,
  purchaseOrders: purchaseOrdersRoutes,
  contacts: contactsRoutes,
  user: userRoutes,
  index: '/'
}