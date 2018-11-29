const API_BASE = '/api';

const baseUsersRoute = `${API_BASE}/users`;

const userRoutes = {
  base: baseUsersRoute,
  login: `${baseUsersRoute}/login`,
};

export const ROUTES = {
  API_BASE,
  INVOICES: `${API_BASE}/invoices`,
  USERS: userRoutes,
};
