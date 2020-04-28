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
const constants_1 = require("@centrifuge/gateway-lib/utils/constants");
const database_service_1 = require("../database/database.service");
const centrifuge_service_1 = require("../centrifuge-client/centrifuge.service");
const custom_attributes_1 = require("@centrifuge/gateway-lib/utils/custom-attributes");
var DocumentTypes;
(function (DocumentTypes) {
    DocumentTypes["INVOICE"] = "http://github.com/centrifuge/centrifuge-protobufs/invoice/#invoice.InvoiceData";
    DocumentTypes["PURCHASE_ORDERS"] = "http://github.com/centrifuge/centrifuge-protobufs/purchaseorder/#purchaseorder.PurchaseOrderData";
    DocumentTypes["GENERIC_DOCUMENT"] = "http://github.com/centrifuge/centrifuge-protobufs/generic/#generic.Generic";
})(DocumentTypes = exports.DocumentTypes || (exports.DocumentTypes = {}));
;
var EventTypes;
(function (EventTypes) {
    EventTypes[EventTypes["DOCUMENT"] = 1] = "DOCUMENT";
    EventTypes[EventTypes["JOB"] = 1] = "JOB";
    EventTypes[EventTypes["ERROR"] = 0] = "ERROR";
})(EventTypes = exports.EventTypes || (exports.EventTypes = {}));
;
let WebhooksController = class WebhooksController {
    constructor(centrifugeService, databaseService) {
        this.centrifugeService = centrifugeService;
        this.databaseService = databaseService;
    }
    receiveMessage(notification) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Receive Webhook', notification);
            try {
                if (notification.event_type === EventTypes.DOCUMENT) {
                    const user = yield this.databaseService.users
                        .findOne({ $or: [{ account: notification.to_id.toLowerCase() }, { account: notification.to_id }] });
                    if (!user) {
                        throw new Error('User is not present in database');
                    }
                    if (notification.document_type === DocumentTypes.GENERIC_DOCUMENT) {
                        const result = yield this.centrifugeService.documents.getDocument(user.account, notification.document_id);
                        const unflattenedAttributes = custom_attributes_1.unflatten(result.attributes);
                        yield this.databaseService.documents.update({ 'header.document_id': notification.document_id, 'ownerId': user._id }, {
                            $set: {
                                ownerId: user._id,
                                header: result.header,
                                data: result.data,
                                attributes: unflattenedAttributes,
                                scheme: result.scheme,
                                fromId: notification.from_id,
                            },
                        }, { upsert: true });
                    }
                    else {
                        throw new Error(`Document type ${notification.document_type} not supported`);
                    }
                }
            }
            catch (e) {
                throw new Error(`Webhook Error: ${e.message}`);
            }
            return 'OK';
        });
    }
};
__decorate([
    common_1.Post(),
    __param(0, common_1.Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "receiveMessage", null);
WebhooksController = __decorate([
    common_1.Controller(constants_1.ROUTES.WEBHOOKS),
    __metadata("design:paramtypes", [centrifuge_service_1.CentrifugeService,
        database_service_1.DatabaseService])
], WebhooksController);
exports.WebhooksController = WebhooksController;
//# sourceMappingURL=webhooks.controller.js.map