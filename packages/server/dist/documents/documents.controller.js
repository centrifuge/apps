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
const database_service_1 = require("../database/database.service");
const centrifuge_service_1 = require("../centrifuge-client/centrifuge.service");
const centrifuge_node_client_1 = require("@centrifuge/gateway-lib/centrifuge-node-client");
const constants_1 = require("@centrifuge/gateway-lib/utils/constants");
const SessionGuard_1 = require("../auth/SessionGuard");
const custom_attributes_1 = require("@centrifuge/gateway-lib/utils/custom-attributes");
let DocumentsController = class DocumentsController {
    constructor(databaseService, centrifugeService) {
        this.databaseService = databaseService;
        this.centrifugeService = centrifugeService;
    }
    create(request, document) {
        return __awaiter(this, void 0, void 0, function* () {
            const payload = Object.assign({}, document, { attributes: Object.assign({}, document.attributes, { _createdBy: {
                        type: 'bytes',
                        value: request.user.account,
                    } }) });
            const createResult = yield this.centrifugeService.documents.createDocumentV2(request.user.account, {
                attributes: payload.attributes,
                readAccess: payload.header.readAccess,
                writeAccess: payload.header.writeAccess,
                scheme: centrifuge_node_client_1.CoreapiCreateDocumentRequest.SchemeEnum.Generic,
            });
            const createAttributes = custom_attributes_1.unflatten(createResult.attributes);
            createResult.attributes = createAttributes;
            const commitResult = yield this.centrifugeService.documents.commitDocumentV2(request.user.account, createResult.header.document_id);
            yield this.centrifugeService.pullForJobComplete(commitResult.header.job_id, request.user.account);
            return yield this.databaseService.documents.insert(Object.assign({}, createResult, { ownerId: request.user._id }));
        });
    }
    getList(request) {
        return __awaiter(this, void 0, void 0, function* () {
            const documents = this.databaseService.documents.getCursor({
                ownerId: request.user._id,
            }).sort({ updatedAt: -1 }).exec();
            return documents;
        });
    }
    getById(params, request) {
        return __awaiter(this, void 0, void 0, function* () {
            const document = yield this.databaseService.documents.findOne({
                _id: params.id,
                ownerId: request.user._id,
            });
            if (!document)
                throw new common_1.NotFoundException('Document not found');
            const docFromNode = yield this.centrifugeService.documents.getDocument(request.user.account, document.header.document_id);
            return Object.assign({ _id: document._id }, docFromNode, { attributes: Object.assign({}, custom_attributes_1.unflatten(docFromNode.attributes)) });
        });
    }
    updateById(params, request, document) {
        return __awaiter(this, void 0, void 0, function* () {
            const documentFromDb = yield this.databaseService.documents.findOne({ _id: params.id });
            if (!documentFromDb)
                throw new common_1.NotFoundException(`Can not find document #${params.id} in the database`);
            delete document.attributes.funding_agreement;
            const updateResult = yield this.centrifugeService.documents.updateDocument(request.user.account, documentFromDb.header.document_id, {
                attributes: document.attributes,
                readAccess: document.header.readAccess,
                writeAccess: document.header.writeAccess,
                scheme: centrifuge_node_client_1.CoreapiCreateDocumentRequest.SchemeEnum.Generic,
            });
            yield this.centrifugeService.pullForJobComplete(updateResult.header.job_id, request.user.account);
            const unflattenAttr = custom_attributes_1.unflatten(updateResult.attributes);
            return yield this.databaseService.documents.updateById(params.id, {
                $set: {
                    header: updateResult.header,
                    data: updateResult.data,
                    attributes: unflattenAttr,
                },
            });
        });
    }
};
__decorate([
    common_1.Post(),
    __param(0, common_1.Req()), __param(1, common_1.Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], DocumentsController.prototype, "create", null);
__decorate([
    common_1.Get(),
    __param(0, common_1.Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DocumentsController.prototype, "getList", null);
__decorate([
    common_1.Get(':id'),
    __param(0, common_1.Param()), __param(1, common_1.Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], DocumentsController.prototype, "getById", null);
__decorate([
    common_1.Put(':id'),
    __param(0, common_1.Param()),
    __param(1, common_1.Req()),
    __param(2, common_1.Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], DocumentsController.prototype, "updateById", null);
DocumentsController = __decorate([
    common_1.Controller(constants_1.ROUTES.DOCUMENTS),
    common_1.UseGuards(SessionGuard_1.SessionGuard),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        centrifuge_service_1.CentrifugeService])
], DocumentsController);
exports.DocumentsController = DocumentsController;
//# sourceMappingURL=documents.controller.js.map