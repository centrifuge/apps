import { env } from 'process';

const config = {
  centrifugeUrl: env.CENTRIFUGE_URL || 'https://127.0.0.1:8081',
  sessionSecret: env.SESSION_SECRET || 'centrifuge',
  dbPath: env.DB_PATH || './db',
  admin: {
    username: env.CENTRIFUGE_ADMIN_USER || 'admin',
    password: env.CENTRIFUGE_ADMIN_PASSWORD || 'admin',
    account: env.CENTRIFUGE_ID || env.CENTRIFUGE_ADMIN_ACCOUNT || '0x0b06ef9F1559143E3aa204884c8B1Db47ef7c2C1',
  },
  inviteOnly: Boolean(env.INVITE_ONLY || false),
};

export default config;
