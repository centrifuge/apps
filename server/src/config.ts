import { env } from 'process';

const config = {
  centrifugeUrl: env.CENTRIFUGE_URL || 'https://35.184.66.29:8082',
  sessionSecret: env.SESSION_SECRET || 'centrifuge',
  dbPath: env.DB_PATH || './db',
  centrifugeId: env.CENTRIFUGE_ID || '0xf77402CA591ba52d51949FF12dC3c1f5c3e0f790',
};

export default config;
