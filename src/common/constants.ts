const API_BASE = '/api';

const baseUsersRoute = `${API_BASE}/users`;
const baseFundingRoute = `${API_BASE}/funding`;

const userRoutes = {
  base: baseUsersRoute,
  login: `${baseUsersRoute}/login`,
  logout: `${baseUsersRoute}/logout`,
  invite: `${baseUsersRoute}/invite`,
  register: `${baseUsersRoute}/register`,
};

const fundingRoutes = {
  base: baseFundingRoute,
  sign: `${baseFundingRoute}/sign`,
};


export const ROUTES = Object.freeze({
  API_BASE,
  INVOICES: `${API_BASE}/invoices`,
  USERS: userRoutes,
  FUNDING: fundingRoutes,
  CONTACTS: `${API_BASE}/contacts`,
  WEBHOOKS: `${API_BASE}/webhooks`,
  PURCHASE_ORDERS: `${API_BASE}/purchase_orders`,
  TRANSFER_DETAILS: `${API_BASE}/transfer_details`
});

export enum PERMISSIONS {
  CAN_FUND_INVOICES = 'can_fund_invoices',
  CAN_CREATE_INVOICES = 'can_create_invoices',
  CAN_MANAGE_USERS = 'can_manage_users',
  CAN_MANAGE_ACCOUNTS = 'can_manage_accounts',
}
