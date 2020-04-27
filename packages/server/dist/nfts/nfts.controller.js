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
const nfts_1 = require("@centrifuge/gateway-lib/models/nfts");
const constants_1 = require("@centrifuge/gateway-lib/utils/constants");
const SessionGuard_1 = require("../auth/SessionGuard");
let NftsController = class NftsController {
    constructor(databaseService, centrifugeService) {
        this.databaseService = databaseService;
        this.centrifugeService = centrifugeService;
    }
    mintNFT(request, body) {
        return __awaiter(this, void 0, void 0, function* () {
            const payload = {
                asset_manager_address: body.asset_manager_address,
                document_id: body.document_id,
                proof_fields: body.proof_fields,
                deposit_address: body.deposit_address,
            };
            console.log('payload', payload);
            const mintingResult = yield this.centrifugeService.nft.mintNft(request.user.account, body.registry_address, payload);
            yield this.centrifugeService.pullForJobComplete(mintingResult.header.job_id, request.user.account);
            return mintingResult;
        });
    }
    transfer(request, body) {
        return __awaiter(this, void 0, void 0, function* () {
            const transferResult = yield this.centrifugeService.nft.transferNft(request.user.account, body.registry, body.token_id, {
                to: body.to,
            });
            yield this.centrifugeService.pullForJobComplete(transferResult.header.jobId, request.user.account);
            return transferResult;
        });
    }
};
__decorate([
    common_1.Post('/mint'),
    __param(0, common_1.Req()),
    __param(1, common_1.Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, nfts_1.MintNftRequest]),
    __metadata("design:returntype", Promise)
], NftsController.prototype, "mintNFT", null);
__decorate([
    common_1.Post('/transfer'),
    __param(0, common_1.Req()),
    __param(1, common_1.Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, nfts_1.TransferNftRequest]),
    __metadata("design:returntype", Promise)
], NftsController.prototype, "transfer", null);
NftsController = __decorate([
    common_1.Controller(constants_1.ROUTES.NFTS),
    common_1.UseGuards(SessionGuard_1.SessionGuard),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        centrifuge_service_1.CentrifugeService])
], NftsController);
exports.NftsController = NftsController;
//# sourceMappingURL=nfts.controller.js.map