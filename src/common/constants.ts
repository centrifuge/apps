const API_BASE = '/api';

const baseUsersRoute = `${API_BASE}/users`;

const userRoutes = {
  base: baseUsersRoute,
  login: `${baseUsersRoute}/login`,
  logout: `${baseUsersRoute}/logout`,
  register: `${baseUsersRoute}/register`,
};

export const ROUTES = Object.freeze({
  API_BASE,
  INVOICES: `${API_BASE}/invoices`,
  USERS: userRoutes,
  CONTACTS: `${API_BASE}/contacts`,
  WEBHOOKS: `${API_BASE}/webhooks`,
  PURCHASE_ORDERS: `${API_BASE}/purchase_orders`,
});

export enum ROLE {
  CAN_INVITE = 'can_invite',
  CAN_MANAGE_USERS = 'can_manage_users',
  CAN_MANAGE_ACCOUNTS = 'can_manage_accounts',
}
