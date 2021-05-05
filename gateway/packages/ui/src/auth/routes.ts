import { ROUTES } from '@centrifuge/gateway-lib/utils/constants';

const index = '/users';

export default {
  index,
  register: `/register`,
  invite: `${index}/invite`,
  logout: ROUTES.USERS.logout
};
