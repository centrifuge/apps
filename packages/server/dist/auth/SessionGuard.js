"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class SessionGuard {
    canActivate(context) {
        const httpContext = context.switchToHttp();
        const request = httpContext.getRequest();
        return !!request.user;
    }
}
exports.SessionGuard = SessionGuard;
//# sourceMappingURL=SessionGuard.js.map