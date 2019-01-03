const API_BASE = '/api';

const baseUsersRoute = `${API_BASE}/users`;

const userRoutes = {
  base: baseUsersRoute,
  login: `${baseUsersRoute}/login`,
  logout: `${baseUsersRoute}/logout`,
};

export const ROUTES = {
  API_BASE,
  INVOICES: `${API_BASE}/invoices`,
  USERS: userRoutes,
  CONTACTS: `${API_BASE}/contacts`,
};
