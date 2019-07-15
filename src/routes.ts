import { invoiceRoutes,fundingRoutes } from './invoices/routes';
import contactsRoutes from './contacts/routes';
import { schemasRoutes } from './admin/schemas/routes';
import userRoutes from './user/routes';

export default {
  invoices: invoiceRoutes,
  funding: fundingRoutes,
  contacts: contactsRoutes,
  user: userRoutes,
  schemas: schemasRoutes,
  index: '/'
}
