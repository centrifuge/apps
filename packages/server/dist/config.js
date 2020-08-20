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
        account: process_1.env.CENTRIFUGE_ADMIN_ACCOUNT || '0x5e7be56f7b9F1684555F66b33bf019e8312707e2',
        chain: {
            centrifuge_chain_account: {
                id: process_1.env.CENTRIFUGE_CHAIN_ID || '0xac4316c9699a37bd15493702c5a9a1aa3936a1ae6b6a3b4e92b38eae393ca659',
                secret: process_1.env.CENTRIFUGE_CHAIN_SECRET || '0xafe50b689f0ee19376768e2aa913d283c25b834ab3aecb558c2c73c0585e63e9',
                ss_58_address: process_1.env.CENTRIFUGE_CHAIN_ADDRESS || '5Fxa2HPJrZ95guPC7G5kitVyAFrrtPcUPR2uN62VKthZiqpg',
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