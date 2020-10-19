import { env } from 'process';
import { PERMISSIONS } from '../../lib/utils/constants';

const config = {
  // URI for centrifuge node
  centrifugeUrl: env.CENTRIFUGE_URL || 'http://127.0.0.1:8082',
  // Port on which the application will run
  applicationPort: env.APPLICATION_PORT || '3001',
  sessionSecret: env.CENTRIFUGE_SESSION_SECRET || 'centrifuge',
  // We use replace to create a new database without changing the deployment config
  dbPath: env.DB_PATH ? env.DB_PATH.replace('db', 'db1') : './db',
  // Default admin user that will be created
  admin: {
    name: env.CENTRIFUGE_ADMIN_USER || 'admin',
    email: env.CENTRIFUGE_ADMIN_EMAIL || 'test@test.org',
    password: env.CENTRIFUGE_ADMIN_PASSWORD || 'admin',
    // Centrifuge Identity Address
    account: env.CENTRIFUGE_ADMIN_ACCOUNT || '0xd1A41F5BCa3366406b01eb2b2F5723Cddf659478',
    chain: {
      centrifuge_chain_account : {
        id: env.CENTRIFUGE_CHAIN_ID || '0xac4316c9699a37bd15493702c5a9a1aa3936a1ae6b6a3b4e92b38eae393ca659',
        secret: env.CENTRIFUGE_CHAIN_SECRET || '0xafe50b689f0ee19376768e2aa913d283c25b834ab3aecb558c2c73c0585e63e9',
        ss_58_address: env.CENTRIFUGE_CHAIN_ADDRESS || '5Fxa2HPJrZ95guPC7G5kitVyAFrrtPcUPR2uN62VKthZiqpg',
      },
    },
    permissions: [PERMISSIONS.CAN_MANAGE_USERS, PERMISSIONS.CAN_MANAGE_SCHEMAS, PERMISSIONS.CAN_VIEW_DOCUMENTS, PERMISSIONS.CAN_MANAGE_DOCUMENTS],
  },
  inviteOnly: Boolean(env.INVITE_ONLY || true),
  ethNetwork: env.ETH_NETWORK || 'mainnet',
  ethProvider: env.ETH_PROVIDER || 'https://mainnet.infura.io/v3/55b957b5c6be42c49e6d48cbb102bdd5',
};
export default config;
