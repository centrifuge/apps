import { ROUTES } from '../common/constants';

const index = '/user';

export default {
  index,
  list: ROUTES.USERS.base,
  register: `${index}/register`,
  logout: ROUTES.USERS.logout
};
