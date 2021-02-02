import { CanActivate, ExecutionContext } from '@nestjs/common';

/**
 * Guard against non-authenticated users by using the saved session state
 */
export class SessionGuard implements CanActivate {
  /**
   * Checks if a user has been set to the request context
   * @param {ExecutionContext} context - the execution context as provided by nest.js
   * @returns {boolean} userAuthenticated
   */
  canActivate(context: ExecutionContext): boolean {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest();

    return !!request.user;
  }
}
