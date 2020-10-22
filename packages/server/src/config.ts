import { env } from 'process';
import { PERMISSIONS } from '../../lib/utils/constants';

const config = {
  // URI for centrifuge node
  centrifugeUrl: env.CENTRIFUGE_URL || 'http://127.0.0.1:8082',
  // The domain on which the application is hosted. Used for building links
  // in emails
  applicationHost: env.CENTRIFUGE_APPLICATION_HOST || 'http://gateway.centrifuge.io',
  // Port on which the application will run
  applicationPort: env.CENTRIFUGE_APPLICATION_PORT || '3001',
  sessionSecret: env.CENTRIFUGE_SESSION_SECRET || 'centrifuge',
  email: {
    host: env.CENTRIFUGE_EMAIL_CLIENT_HOST || 'smtp.sendgrid.net',
    port: env.CENTRIFUGE_EMAIL_CLIENT_PORT || 587,
    secure: env.CENTRIFUGE_EMAIL_CLIENT_SECURE || true,
    user: env.CENTRIFUGE_EMAIL_CLIENT_USER || 'apikey',
    password: env.CENTRIFUGE_EMAIL_SERVICE_APIKEY,
    from: env.CENTRIFUGE_ADMIN_EMAIL || 'gateway@centrifuge.io',
  },
  // We use replace to create a new database without changing the deployment config
  dbPath: env.CENTRIFUGE_DB_PATH ? env.CENTRIFUGE_DB_PATH.replace('db', 'db1') : './db',
  // Default admin user that will be created
  admin: {
    name: env.CENTRIFUGE_ADMIN_USER || 'admin',
    email: env.CENTRIFUGE_ADMIN_EMAIL || 'gateway@centrifuge.io',
    password: env.CENTRIFUGE_ADMIN_PASSWORD || 'admin',
    // Centrifuge Identity Address
    account: env.CENTRIFUGE_ADMIN_ACCOUNT,
    chain: {
      centrifuge_chain_account: {
        id: env.CENTRIFUGE_CHAIN_ID,
        secret: env.CENTRIFUGE_CHAIN_SECRET,
        ss_58_address: env.CENTRIFUGE_CHAIN_ADDRESS,
      },
    },
    permissions: [
      PERMISSIONS.CAN_MANAGE_USERS,
      PERMISSIONS.CAN_MANAGE_SCHEMAS,
      PERMISSIONS.CAN_VIEW_DOCUMENTS,
      PERMISSIONS.CAN_MANAGE_DOCUMENTS,
    ],
  },
  inviteOnly: Boolean(env.CENTRIFUGE_INVITE_ONLY || true),
  ethNetwork: env.ETH_NETWORK || 'mainnet',
  ethProvider:
    env.ETH_PROVIDER ||
    'https://mainnet.infura.io/v3/55b957b5c6be42c49e6d48cbb102bdd5',
};
export default config;
