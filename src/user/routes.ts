import { ROUTES } from '../common/constants';

const index = '/user';

export default {
  index,
  register: `${index}/register`,
  invite: `${index}/invite`,
  logout: ROUTES.USERS.logout
};
