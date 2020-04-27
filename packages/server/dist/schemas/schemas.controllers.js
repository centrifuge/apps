"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const SessionGuard_1 = require("../auth/SessionGuard");
const constants_1 = require("@centrifuge/gateway-lib/utils/constants");
const database_service_1 = require("../database/database.service");
const schema_1 = require("@centrifuge/gateway-lib/models/schema");
let SchemasController = class SchemasController {
    constructor(databaseService) {
        this.databaseService = databaseService;
    }
    create(schema) {
        return __awaiter(this, void 0, void 0, function* () {
            let newSchema;
            try {
                newSchema = new schema_1.Schema(schema.name, schema.attributes, schema.registries, schema.formFeatures);
            }
            catch (err) {
                throw new common_1.BadRequestException(err.message);
            }
            const schemaFromDB = yield this.databaseService.schemas.findOne({ name: newSchema.name });
            if (schemaFromDB)
                throw new common_1.ConflictException(`Schema with name ${newSchema.name} exists in the database`);
            return yield this.databaseService.schemas.insert(newSchema);
        });
    }
    get(params) {
        return __awaiter(this, void 0, void 0, function* () {
            params && Object.keys(params).forEach((key) => {
                try {
                    params[key] = JSON.parse(params[key]);
                }
                catch (e) {
                }
            });
            return yield this.databaseService.schemas.getCursor(params).sort({ createdAt: -1 }).exec();
        });
    }
    getById(params) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.databaseService.schemas.findOne({
                _id: params.id,
            });
        });
    }
    update(params, update) {
        return __awaiter(this, void 0, void 0, function* () {
            const oldSchema = yield this.databaseService.schemas.findOne({ _id: params.id });
            try {
                schema_1.Schema.validateDiff(oldSchema, update);
                schema_1.Schema.validate(update);
            }
            catch (err) {
                throw new common_1.BadRequestException(err.message);
            }
            const { name, attributes, registries, formFeatures, label } = update;
            return yield this.databaseService.schemas.updateById(params.id, {
                $set: {
                    name,
                    label,
                    attributes,
                    registries,
                    formFeatures,
                },
            });
        });
    }
    archive(params) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.databaseService.schemas.updateById(params.id, {
                $set: {
                    archived: true,
                },
            });
        });
    }
    restore(params) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.databaseService.schemas.updateById(params.id, {
                $set: {
                    archived: false,
                },
            });
        });
    }
};
__decorate([
    common_1.Post(),
    __param(0, common_1.Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [schema_1.Schema]),
    __metadata("design:returntype", Promise)
], SchemasController.prototype, "create", null);
__decorate([
    common_1.Get(),
    __param(0, common_1.Query()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SchemasController.prototype, "get", null);
__decorate([
    common_1.Get(':id'),
    __param(0, common_1.Param()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SchemasController.prototype, "getById", null);
__decorate([
    common_1.Put(':id'),
    __param(0, common_1.Param()), __param(1, common_1.Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, schema_1.Schema]),
    __metadata("design:returntype", Promise)
], SchemasController.prototype, "update", null);
__decorate([
    common_1.Put(':id/archive'),
    __param(0, common_1.Param()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SchemasController.prototype, "archive", null);
__decorate([
    common_1.Put(':id/restore'),
    __param(0, common_1.Param()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SchemasController.prototype, "restore", null);
SchemasController = __decorate([
    common_1.Controller(constants_1.ROUTES.SCHEMAS),
    common_1.UseGuards(SessionGuard_1.SessionGuard),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], SchemasController);
exports.SchemasController = SchemasController;
//# sourceMappingURL=schemas.controllers.js.map