"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_module_1 = require("../database/database.module");
const auth_module_1 = require("../auth/auth.module");
const centrifuge_module_1 = require("../centrifuge-client/centrifuge.module");
const documents_controller_1 = require("./documents.controller");
const common_1 = require("@nestjs/common");
let DocumentsModule = class DocumentsModule {
};
DocumentsModule = __decorate([
    common_1.Module({
        controllers: [documents_controller_1.DocumentsController],
        providers: [],
        imports: [database_module_1.DatabaseModule, auth_module_1.AuthModule, centrifuge_module_1.CentrifugeModule]
    })
], DocumentsModule);
exports.DocumentsModule = DocumentsModule;
//# sourceMappingURL=documents.module.js.map