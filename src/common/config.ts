import { env } from 'process';
import { PERMISSIONS } from './constants';

const config = {
  centrifugeUrl: env.CENTRIFUGE_URL || 'http://127.0.0.1:8082',
  sessionSecret: env.SESSION_SECRET || 'centrifuge',
  dbPath: env.DB_PATH ? env.DB_PATH.replace('db','db1') : './db',
  admin: {
    name: env.CENTRIFUGE_ADMIN_USER || 'admin',
    email: env.CENTRIFUGE_ADMIN_EMAIL || 'test@test.org',
    password: env.CENTRIFUGE_ADMIN_PASSWORD || 'admin',
    account:  env.CENTRIFUGE_ADMIN_ACCOUNT || '0xc910ec8509eBee65D35FA05C5b0C574070D479AD',
    permissions:[PERMISSIONS.CAN_MANAGE_USERS, PERMISSIONS.CAN_MANAGE_SCHEMAS, PERMISSIONS.CAN_CREATE_INVOICES],
  },
  inviteOnly: Boolean(env.INVITE_ONLY || true),
  ethNetwork:  env.ETH_NETWORK || 'kovan',
  ethProvider: env.ETH_PROVIDER || 'https://kovan.infura.io/v3/55b957b5c6be42c49e6d48cbb102bdd5',
};

export default config;
