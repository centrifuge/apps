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
const app_service_1 = require("../app.service");
const config_1 = require("../config");
let AllExceptionFilter = class AllExceptionFilter {
    constructor(appService) {
        this.appService = appService;
    }
    catch(exception, host) {
        return __awaiter(this, void 0, void 0, function* () {
            const ctx = host.switchToHttp();
            const response = ctx.getResponse();
            const request = ctx.getRequest();
            if (exception.getStatus) {
                const status = exception.getStatus();
                if (status === 404 &&
                    request.headers.accept &&
                    request.headers.accept.indexOf('text/html') !== -1) {
                    return response.render('index', {
                        preloaderState: this.appService.preloadReduxStore(request.user),
                        ethNetwork: config_1.default.ethNetwork,
                    });
                }
                return response.status(status).json(exception.getResponse());
            }
            else {
                if (exception.constructor.name === 'FetchError') {
                    return response.status(common_1.HttpStatus.BAD_REQUEST).json(exception.message);
                }
                else if (exception.constructor.name === 'Body') {
                    let message;
                    if (exception.headers.get('content-type').match('application/json')) {
                        message = (yield exception.json()).message;
                    }
                    else {
                        message = yield exception.text();
                    }
                    return response.status(exception.status).json({
                        statusCode: exception.status,
                        message,
                    });
                }
                else {
                    console.log(exception);
                    return response.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({
                        statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                        message: 'Unhandled Exception',
                    });
                }
            }
        });
    }
};
AllExceptionFilter = __decorate([
    common_1.Catch(),
    __metadata("design:paramtypes", [app_service_1.AppService])
], AllExceptionFilter);
exports.AllExceptionFilter = AllExceptionFilter;
//# sourceMappingURL=all-exception.filter.js.map