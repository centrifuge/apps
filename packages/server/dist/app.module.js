"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const users_module_1 = require("./users/users.module");
const auth_module_1 = require("./auth/auth.module");
const contacts_module_1 = require("./contacts/contacts.module");
const webhooks_module_1 = require("./webhooks/webhooks.module");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const core_1 = require("@nestjs/core");
const funding_module_1 = require("./funding/funding.module");
const all_exception_filter_1 = require("./exceptions/all-exception.filter");
const schemas_module_1 = require("./schemas/schemas.module");
const documents_module_1 = require("./documents/documents.module");
const nfts_module_1 = require("./nfts/nfts.module");
let AppModule = class AppModule {
};
AppModule = __decorate([
    common_1.Module({
        controllers: [app_controller_1.AppController],
        providers: [
            app_service_1.AppService,
            {
                provide: core_1.APP_FILTER,
                useClass: all_exception_filter_1.AllExceptionFilter,
            },
        ],
        imports: [
            auth_module_1.AuthModule,
            contacts_module_1.ContactsModule,
            funding_module_1.FundingModule,
            users_module_1.UsersModule,
            webhooks_module_1.WebhooksModule,
            schemas_module_1.SchemasModule,
            documents_module_1.DocumentsModule,
            nfts_module_1.NftsModule,
        ],
    })
], AppModule);
exports.AppModule = AppModule;
//# sourceMappingURL=app.module.js.map