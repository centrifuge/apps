import { env } from 'process';
import { PERMISSIONS } from '../../lib/utils/constants';

const config = {
  // URI for centrifuge node
  centrifugeUrl: env.CENTRIFUGE_URL || 'http://127.0.0.1:8082',
  // Port on which the application will run
  applicationPort: env.APPLICATION_PORT || '3001',
  sessionSecret: env.SESSION_SECRET || 'centrifuge',
  // We use replace to create a new database without changing the deployment config
  dbPath: env.DB_PATH ? env.DB_PATH.replace('db', 'db1') : './db',
  // Default admin user that will be created
  admin: {
    name: env.CENTRIFUGE_ADMIN_USER || 'admin',
    email: env.CENTRIFUGE_ADMIN_EMAIL || 'test@test.org',
    password: env.CENTRIFUGE_ADMIN_PASSWORD || 'admin',
    // Centrifuge Identity Address
    account: env.CENTRIFUGE_ADMIN_ACCOUNT || '0xd73C302A440dbA95d3f215455523365dE08eC677',
    chain: {
      centrifuge_chain_account : {
        id: env.CENTRIFUGE_CHAIN_ID || '5GsguKZEenCwq9FTzvecQS32YSkJv6ySjApoDRQ4H8D8HQqx',
        secret: env.CENTRIFUGE_CHAIN_SECRET || '0xd4c641645b26aae66aa19e942c8a386eb7f1e72b1d711bc057b3597c91004e45',
        ss_58_address: env.CENTRIFUGE_CHAIN_ADDRESS || '0xdbacfff9b7eddd346d182fe71a5ed6649ce14bacad5bc6f0b7ba13618793b636',
      },
    },
    permissions: [PERMISSIONS.CAN_MANAGE_USERS, PERMISSIONS.CAN_MANAGE_SCHEMAS, PERMISSIONS.CAN_VIEW_DOCUMENTS, PERMISSIONS.CAN_MANAGE_DOCUMENTS],
  },
  inviteOnly: Boolean(env.INVITE_ONLY || true),
  ethNetwork: env.ETH_NETWORK || 'mainnet',
  ethProvider: env.ETH_PROVIDER || 'https://mainnet.infura.io/v3/55b957b5c6be42c49e6d48cbb102bdd5',
};
export default config;
