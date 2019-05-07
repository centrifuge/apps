import { ROUTES } from '../common/constants';

const index = '/user';

export default {
  index,
  register: `${index}/register`,
  logout: ROUTES.USERS.logout
};
