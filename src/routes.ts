import invoiceRoutes from './invoices/routes';
import contactsRoutes from './contacts/routes';
import userRoutes from './user/routes';

export default {
  invoices: invoiceRoutes,
  contacts: contactsRoutes,
  user: userRoutes,
  index: '/'
}
