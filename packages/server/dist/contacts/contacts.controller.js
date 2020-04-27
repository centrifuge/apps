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
const contact_1 = require("@centrifuge/gateway-lib/models/contact");
const constants_1 = require("@centrifuge/gateway-lib/utils/constants");
const database_service_1 = require("../database/database.service");
let ContactsController = class ContactsController {
    constructor(databaseService) {
        this.databaseService = databaseService;
    }
    create(request, contact) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                contact_1.Contact.validate(contact);
            }
            catch (err) {
                throw new common_1.BadRequestException(err.message);
            }
            const newContact = new contact_1.Contact(contact.name.trim(), contact.address.toLowerCase().trim(), request.user._id);
            return yield this.databaseService.contacts.insert(newContact);
        });
    }
    get(request) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.databaseService.contacts.getCursor({
                ownerId: request.user._id,
            }).sort({ updatedAt: -1 }).exec();
        });
    }
    updateById(params, updateContactObject, request) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.databaseService.contacts.update({ _id: params.id, ownerId: request.user._id }, Object.assign({}, updateContactObject, { ownerId: request.user._id }));
        });
    }
};
__decorate([
    common_1.Post(),
    __param(0, common_1.Req()), __param(1, common_1.Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, contact_1.Contact]),
    __metadata("design:returntype", Promise)
], ContactsController.prototype, "create", null);
__decorate([
    common_1.Get(),
    __param(0, common_1.Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ContactsController.prototype, "get", null);
__decorate([
    common_1.Put(':id'),
    __param(0, common_1.Param()),
    __param(1, common_1.Body()),
    __param(2, common_1.Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, contact_1.Contact, Object]),
    __metadata("design:returntype", Promise)
], ContactsController.prototype, "updateById", null);
ContactsController = __decorate([
    common_1.Controller(constants_1.ROUTES.CONTACTS),
    common_1.UseGuards(SessionGuard_1.SessionGuard),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], ContactsController);
exports.ContactsController = ContactsController;
//# sourceMappingURL=contacts.controller.js.map