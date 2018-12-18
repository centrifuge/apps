import { env } from 'process';

const config = {
  centrifugeUrl: env.CENTRIFUGE_URL || 'https://localhost:8082',
  sessionSecret: env.SESSION_SECRET || 'centrifuge',
};

export default config;
