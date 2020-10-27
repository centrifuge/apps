const API_BASE = '/api';

const baseUsersRoute = `${API_BASE}/users`;
const baseFundingRoute = `${API_BASE}/funding`;

const userRoutes = {
  base: baseUsersRoute,
  login: `${baseUsersRoute}/login`,
  generateToken: `${baseUsersRoute}/generateToken`,
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
  ORGANIZATIONS: `${API_BASE}/organizations`,
  WEBHOOKS: `${API_BASE}/webhooks`,
  PURCHASE_ORDERS: `${API_BASE}/purchase_orders`,
  TRANSFER_DETAILS: `${API_BASE}/transfer_details`,
  SCHEMAS: `${API_BASE}/schemas`,
  DOCUMENTS: `${API_BASE}/documents`,
  NFTS: `${API_BASE}/nfts`,
});

export enum PERMISSIONS {
  CAN_MANAGE_USERS = 'can_manage_users',
  CAN_MANAGE_ACCOUNTS = 'can_manage_accounts',
  CAN_MANAGE_SCHEMAS = 'can_manage_schemas',
  CAN_MANAGE_DOCUMENTS = 'can_manage_documents',
  CAN_VIEW_DOCUMENTS = 'can_view_documents'
}
