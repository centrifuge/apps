import userRoutes from './auth/routes'
import contactsRoutes from './contacts/routes'
import documentRoutes from './documents/routes'
import schemasRoutes from './schemas/routes'

const routes = {
  documents: documentRoutes,
  contacts: contactsRoutes,
  user: userRoutes,
  schemas: schemasRoutes,
  index: '/',
}

export default routes
