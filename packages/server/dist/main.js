"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const path = require("path");
const session = require("express-session");
const passport = require("passport");
const config_1 = require("./config");
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '1';
function bootstrap() {
    return __awaiter(this, void 0, void 0, function* () {
        const app = yield core_1.NestFactory.create(app_module_1.AppModule);
        app.use(session({
            secret: config_1.default.sessionSecret,
            resave: false,
            saveUninitialized: false,
        }));
        app.use(passport.initialize());
        app.use(passport.session());
        app.setViewEngine('html');
        app.engine('html', require('hbs').__express);
        app.setBaseViewsDir(path.resolve('./build'));
        app.useStaticAssets(path.resolve('./build'), { index: false });
        const server = yield app.listen(config_1.default.applicationPort);
        console.log('PORT', config_1.default.applicationPort);
        server.setTimeout(0);
    });
}
bootstrap();
//# sourceMappingURL=main.js.map