import contactsRoutes from './contacts/routes';
import  schemasRoutes from './schemas/routes';
import  documentRoutes from './documents/routes';
import userRoutes from './auth/routes';

export default {
  documents: documentRoutes,
  contacts: contactsRoutes,
  user: userRoutes,
  schemas: schemasRoutes,
  index: '/'
}
