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
    account: env.CENTRIFUGE_ADMIN_ACCOUNT || '0x66f5db3a5ecfe25cc705647d7efc4778145fd499',
    chain: {
      centrifuge_chain_account : {
        id: env.CENTRIFUGE_CHAIN_ID || '0xd8a4fbe4de3e82f368210b86a9429b4612d11a8c874b59008f2e5f761c21f012',
        secret: env.CENTRIFUGE_CHAIN_SECRET || '0x6acac51ba69a5fb8a80baf6f4258a895d863fa6855794240f2ebf09f3ddac13b',
        ss_58_address: env.CENTRIFUGE_CHAIN_ADDRESS || '5GxmDB9eP6hgLVYB9yq1vZLHdzTYfQn76ZjjsnTs3QQ5hJdj',
      },
    },
    permissions: [PERMISSIONS.CAN_MANAGE_USERS, PERMISSIONS.CAN_MANAGE_SCHEMAS, PERMISSIONS.CAN_VIEW_DOCUMENTS, PERMISSIONS.CAN_MANAGE_DOCUMENTS],
  },
  inviteOnly: Boolean(env.INVITE_ONLY || true),
  ethNetwork: env.ETH_NETWORK || 'mainnet',
  ethProvider: env.ETH_PROVIDER || 'https://mainnet.infura.io/v3/55b957b5c6be42c49e6d48cbb102bdd5',
};
export default config;
