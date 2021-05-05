import userRoutes from './auth/routes'
import contactsRoutes from './contacts/routes'
import documentRoutes from './documents/routes'
import schemasRoutes from './schemas/routes'

export default {
  documents: documentRoutes,
  contacts: contactsRoutes,
  user: userRoutes,
  schemas: schemasRoutes,
  index: '/',
}
