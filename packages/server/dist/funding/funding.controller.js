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
const funding_request_1 = require("@centrifuge/gateway-lib/models/funding-request");
const funding_request_2 = require("@centrifuge/gateway-lib/models/funding-request");
let FundingController = class FundingController {
    constructor(databaseService, centrifugeService) {
        this.databaseService = databaseService;
        this.centrifugeService = centrifugeService;
    }
    sign(payload, req) {
        return __awaiter(this, void 0, void 0, function* () {
            const signatureResponse = yield this.centrifugeService.funding.signFundingAgreement(req.user.account, payload.document_id, payload.agreement_id);
            yield this.centrifugeService.pullForJobComplete(signatureResponse.header.jobId, req.user.account);
            return signatureResponse;
        });
    }
    create(fundingRequest, req) {
        return __awaiter(this, void 0, void 0, function* () {
            const payload = {
                data: {
                    amount: fundingRequest.amount.toString(),
                    apr: fundingRequest.apr.toString(),
                    days: fundingRequest.days.toString(),
                    fee: fundingRequest.fee.toString(),
                    repaymentDueDate: fundingRequest.repayment_due_date,
                    repaymentAmount: fundingRequest.repayment_amount.toString(),
                    currency: fundingRequest.currency.toString(),
                    borrowerId: req.user.account.toString(),
                    funderId: fundingRequest.funder_id.toString(),
                },
            };
            if (fundingRequest.nft_address)
                payload.data.nftAddress = fundingRequest.nft_address;
            const fundingResponse = yield this.centrifugeService.funding.createFundingAgreement(req.user.account, fundingRequest.document_id, payload);
            yield this.centrifugeService.pullForJobComplete(fundingResponse.header.jobId, req.user.account);
            const signatureResponse = yield this.centrifugeService.funding.signFundingAgreement(req.user.account, fundingRequest.document_id, fundingResponse.data.funding.agreementId);
            yield this.centrifugeService.pullForJobComplete(signatureResponse.header.jobId, req.user.account);
            return signatureResponse;
        });
    }
};
__decorate([
    common_1.Post(constants_1.ROUTES.FUNDING.sign),
    __param(0, common_1.Body()), __param(1, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [funding_request_2.FundingSignatureRequest, Object]),
    __metadata("design:returntype", Promise)
], FundingController.prototype, "sign", null);
__decorate([
    common_1.Post(constants_1.ROUTES.FUNDING.base),
    __param(0, common_1.Body()), __param(1, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [funding_request_1.FundingRequest, Object]),
    __metadata("design:returntype", Promise)
], FundingController.prototype, "create", null);
FundingController = __decorate([
    common_1.Controller(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        centrifuge_service_1.CentrifugeService])
], FundingController);
exports.FundingController = FundingController;
//# sourceMappingURL=funding.controller.js.map