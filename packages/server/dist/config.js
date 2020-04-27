"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const process_1 = require("process");
const constants_1 = require("../../lib/utils/constants");
const config = {
    centrifugeUrl: process_1.env.CENTRIFUGE_URL || 'http://127.0.0.1:8082',
    applicationPort: process_1.env.APPLICATION_PORT || '3001',
    sessionSecret: process_1.env.SESSION_SECRET || 'centrifuge',
    dbPath: process_1.env.DB_PATH ? process_1.env.DB_PATH.replace('db', 'db1') : './db',
    admin: {
        name: process_1.env.CENTRIFUGE_ADMIN_USER || 'admin',
        email: process_1.env.CENTRIFUGE_ADMIN_EMAIL || 'test@test.org',
        password: process_1.env.CENTRIFUGE_ADMIN_PASSWORD || 'admin',
        account: process_1.env.CENTRIFUGE_ADMIN_ACCOUNT || '0xd73C302A440dbA95d3f215455523365dE08eC677',
        chain: {
            centrifuge_chain_account: {
                id: process_1.env.CENTRIFUGE_CHAIN_ID || '5GsguKZEenCwq9FTzvecQS32YSkJv6ySjApoDRQ4H8D8HQqx',
                secret: process_1.env.CENTRIFUGE_CHAIN_SECRET || '0xd4c641645b26aae66aa19e942c8a386eb7f1e72b1d711bc057b3597c91004e45',
                ss_58_address: process_1.env.CENTRIFUGE_CHAIN_ADDRESS || '0xdbacfff9b7eddd346d182fe71a5ed6649ce14bacad5bc6f0b7ba13618793b636',
            },
        },
        permissions: [constants_1.PERMISSIONS.CAN_MANAGE_USERS, constants_1.PERMISSIONS.CAN_MANAGE_SCHEMAS, constants_1.PERMISSIONS.CAN_VIEW_DOCUMENTS, constants_1.PERMISSIONS.CAN_MANAGE_DOCUMENTS],
    },
    inviteOnly: Boolean(process_1.env.INVITE_ONLY || true),
    ethNetwork: process_1.env.ETH_NETWORK || 'mainnet',
    ethProvider: process_1.env.ETH_PROVIDER || 'https://mainnet.infura.io/v3/55b957b5c6be42c49e6d48cbb102bdd5',
};
exports.default = config;
//# sourceMappingURL=config.js.map