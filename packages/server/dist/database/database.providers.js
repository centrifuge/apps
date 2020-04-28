"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("util");
const bcrypt = require("bcrypt");
const database_repository_1 = require("./database.repository");
const config_1 = require("../config");
const database_service_1 = require("./database.service");
const initializeDatabase = (inMemoryOnly) => __awaiter(this, void 0, void 0, function* () {
    const usersRepository = new database_repository_1.DatabaseRepository({ filename: `${config_1.default.dbPath}/usersDb`, inMemoryOnly });
    const admin = {
        name: config_1.default.admin.name,
        password: yield util_1.promisify(bcrypt.hash)(config_1.default.admin.password, 10),
        email: config_1.default.admin.email,
        enabled: true,
        invited: false,
        schemas: [],
        account: config_1.default.admin.account,
        chain: config_1.default.admin.chain,
        permissions: config_1.default.admin.permissions,
    };
    const userExists = yield usersRepository.findOne({
        email: admin.email,
    });
    if (!userExists) {
        yield usersRepository.insert(admin);
    }
    const contactsRepository = new database_repository_1.DatabaseRepository({ filename: `${config_1.default.dbPath}/contactsDb`, inMemoryOnly });
    const schemasRepository = new database_repository_1.DatabaseRepository({ filename: `${config_1.default.dbPath}/schemasDb`, inMemoryOnly });
    const documentsRepository = new database_repository_1.DatabaseRepository({ filename: `${config_1.default.dbPath}/documentsDb`, inMemoryOnly });
    return {
        users: usersRepository,
        contacts: contactsRepository,
        schemas: schemasRepository,
        documents: documentsRepository,
    };
});
let initializeDatabasePromise;
exports.databaseServiceProvider = {
    provide: database_service_1.DatabaseService,
    useFactory: () => __awaiter(this, void 0, void 0, function* () {
        let testingMode;
        if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'functional') {
            testingMode = true;
        }
        if (!initializeDatabasePromise || testingMode) {
            initializeDatabasePromise = initializeDatabase(testingMode);
        }
        return initializeDatabasePromise;
    }),
};
//# sourceMappingURL=database.providers.js.map