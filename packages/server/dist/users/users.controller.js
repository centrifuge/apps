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
const bcrypt = require("bcrypt");
const util_1 = require("util");
const constants_1 = require("@centrifuge/gateway-lib/utils/constants");
const user_1 = require("@centrifuge/gateway-lib/models/user");
const database_service_1 = require("../database/database.service");
const config_1 = require("../config");
const centrifuge_service_1 = require("../centrifuge-client/centrifuge.service");
const admin_auth_guard_1 = require("../auth/admin.auth.guard");
let UsersController = class UsersController {
    constructor(databaseService, centrifugeService) {
        this.databaseService = databaseService;
        this.centrifugeService = centrifugeService;
    }
    login(user, req) {
        return __awaiter(this, void 0, void 0, function* () {
            return req.user;
        });
    }
    logout(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            req.logout();
            return res.redirect('/');
        });
    }
    getAllUsers(request) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.databaseService.users.find({});
        });
    }
    register(user) {
        return __awaiter(this, void 0, void 0, function* () {
            const existingUser = yield this.databaseService.users.findOne({
                email: user.email,
            });
            if (!user.password || !user.password.trim()) {
                throw new common_1.ForbiddenException('Password is mandatory');
            }
            if (config_1.default.inviteOnly) {
                if (existingUser && existingUser.invited && !existingUser.enabled) {
                    return this.upsertUser(Object.assign({}, existingUser, { password: user.password, enabled: true }), existingUser._id);
                }
                else {
                    throw new common_1.ForbiddenException('Email taken!');
                }
            }
            else {
                if (existingUser) {
                    throw new common_1.ForbiddenException('Email taken!');
                }
                return this.upsertUser(Object.assign({}, user, { enabled: true, invited: false }));
            }
        });
    }
    invite(user) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!config_1.default.inviteOnly) {
                throw new common_1.ForbiddenException('Invite functionality not enabled!');
            }
            const userExists = yield this.databaseService.users.findOne({
                email: user.email,
            });
            if (userExists) {
                throw new common_1.ForbiddenException('User already invited!');
            }
            return this.upsertUser(Object.assign({}, user, { name: user.name, email: user.email, account: undefined, chain: undefined, password: undefined, enabled: false, invited: true, schemas: user.schemas, permissions: user.permissions }));
        });
    }
    update(user) {
        return __awaiter(this, void 0, void 0, function* () {
            const otherUserWithEmail = yield this.databaseService.users.findOne({
                email: user.email,
                $not: {
                    _id: user._id,
                },
            });
            if (otherUserWithEmail) {
                throw new common_1.ForbiddenException('Email taken!');
            }
            return yield this.databaseService.users.updateById(user._id, {
                $set: {
                    name: user.name,
                    email: user.email,
                    permissions: user.permissions,
                    schemas: user.schemas,
                },
            });
        });
    }
    upsertUser(user, id = '') {
        return __awaiter(this, void 0, void 0, function* () {
            if (!user.account) {
                const account = yield this.centrifugeService.accounts.generateAccount(config_1.default.admin.chain);
                user.account = account.identity_id.toLowerCase();
            }
            if (user.password) {
                user.password = yield util_1.promisify(bcrypt.hash)(user.password, 10);
            }
            const result = yield this.databaseService.users.updateById(id, user, true);
            return result;
        });
    }
};
__decorate([
    common_1.Post(constants_1.ROUTES.USERS.login),
    common_1.HttpCode(200),
    __param(0, common_1.Body()), __param(1, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_1.User, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "login", null);
__decorate([
    common_1.Get(constants_1.ROUTES.USERS.logout),
    __param(0, common_1.Request()), __param(1, common_1.Response()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "logout", null);
__decorate([
    common_1.Get(constants_1.ROUTES.USERS.base),
    common_1.UseGuards(admin_auth_guard_1.UserAuthGuard),
    __param(0, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getAllUsers", null);
__decorate([
    common_1.Post(constants_1.ROUTES.USERS.base),
    __param(0, common_1.Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_1.User]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "register", null);
__decorate([
    common_1.Post(constants_1.ROUTES.USERS.invite),
    common_1.UseGuards(admin_auth_guard_1.UserAuthGuard),
    __param(0, common_1.Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "invite", null);
__decorate([
    common_1.Put(constants_1.ROUTES.USERS.base),
    common_1.UseGuards(admin_auth_guard_1.UserAuthGuard),
    __param(0, common_1.Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "update", null);
UsersController = __decorate([
    common_1.Controller(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        centrifuge_service_1.CentrifugeService])
], UsersController);
exports.UsersController = UsersController;
//# sourceMappingURL=users.controller.js.map