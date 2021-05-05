import { AuthGuard } from '@nestjs/passport'
import { ExecutionContext, Injectable } from '@nestjs/common'

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
