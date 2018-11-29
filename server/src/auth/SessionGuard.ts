import { CanActivate, ExecutionContext } from '@nestjs/common';

export class SessionGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest();

    return !!request.user;
  }
}
