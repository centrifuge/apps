import { PERMISSIONS } from '@centrifuge/gateway-lib/utils/constants'
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Observable } from 'rxjs'

@Injectable()
export class UserManagerAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest()
    return this.validateRequest(request)
  }

  /**
   * Validates access to a protected route with permissions on a user
   * @async
   * @param request
   */
  async validateRequest(request) {
    if (request.user?.permissions?.includes(PERMISSIONS.CAN_MANAGE_USERS)) {
      return true
    }
    return false
  }
}
