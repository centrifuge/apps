import { ROUTES } from '@centrifuge/gateway-lib/src/utils/constants'

const index = '/users'

export default {
  index,
  register: `/register`,
  invite: `${index}/invite`,
  logout: ROUTES.USERS.logout,
}
