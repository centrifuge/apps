import { env } from 'process';
import { PERMISSIONS } from './constants';

const config = {
  centrifugeUrl: env.CENTRIFUGE_URL || 'http://127.0.0.1:8084',
  sessionSecret: env.SESSION_SECRET || 'centrifuge',
  dbPath: env.DB_PATH ? env.DB_PATH.replace('db','db1') : './db',
  admin: {
    name: env.CENTRIFUGE_ADMIN_USER || 'admin',
    email: env.CENTRIFUGE_ADMIN_EMAIL || 'test@test.org',
    password: env.CENTRIFUGE_ADMIN_PASSWORD || 'admin',
    account:  env.CENTRIFUGE_ADMIN_ACCOUNT || '0x5f2bBFcf948a0083bbE77C0aD97A64142D6b1D48',
    permissions:[PERMISSIONS.CAN_MANAGE_USERS,PERMISSIONS.CAN_CREATE_INVOICES],
  },
  inviteOnly: Boolean(env.INVITE_ONLY || true),
  ethProvider: env.ETH_PROVIDER || 'https://rinkeby.infura.io/v3/55b957b5c6be42c49e6d48cbb102bdd5',
};

export default config;
