import { ROUTES } from '@centrifuge/gateway-lib/utils/constants'

const index = '/users'

const routes = {
  index,
  register: `/register`,
  invite: `${index}/invite`,
  logout: ROUTES.USERS.logout,
}

export default routes
