"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const centrifuge_service_1 = require("./centrifuge.service");
const centrifuge_client_mock_1 = require("./centrifuge-client.mock");
const config_1 = require("../config");
function checkNodeEnvironment() {
    switch (process.env.NODE_ENV) {
        case 'test': {
            return new centrifuge_client_mock_1.MockCentrifugeService();
        }
        case 'functional': {
            config_1.default.centrifugeUrl = 'http://127.0.0.1:8084';
            return new centrifuge_service_1.CentrifugeService();
        }
    }
    return new centrifuge_service_1.CentrifugeService();
}
exports.centrifugeServiceProvider = {
    provide: centrifuge_service_1.CentrifugeService,
    useValue: checkNodeEnvironment(),
};
let CentrifugeModule = class CentrifugeModule {
};
CentrifugeModule = __decorate([
    common_1.Module({
        providers: [exports.centrifugeServiceProvider],
        exports: [exports.centrifugeServiceProvider],
    })
], CentrifugeModule);
exports.CentrifugeModule = CentrifugeModule;
//# sourceMappingURL=centrifuge.module.js.map