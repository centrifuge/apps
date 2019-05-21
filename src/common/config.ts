import { env } from 'process';
import { PERMISSIONS } from './constants';

const config = {
  centrifugeUrl: env.CENTRIFUGE_URL || 'http://127.0.0.1:8084',
  sessionSecret: env.SESSION_SECRET || 'centrifuge',
  dbPath: env.DB_PATH || './db',
  admin: {
    name: env.CENTRIFUGE_ADMIN_USER || 'admin',
    email: env.CENTRIFUGE_ADMIN_EMAIL || 'test@test.org',
    password: env.CENTRIFUGE_ADMIN_PASSWORD || 'admin',
    account: env.CENTRIFUGE_ID || env.CENTRIFUGE_ADMIN_ACCOUNT || '0x5f2bBFcf948a0083bbE77C0aD97A64142D6b1D48',
    permissions:[PERMISSIONS.CAN_MANAGE_USERS],
  },
  inviteOnly: Boolean(env.INVITE_ONLY || true),
};

export default config;
