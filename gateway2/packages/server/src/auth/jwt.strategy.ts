import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from './auth.service';
import config from '../config';
import { JWTPayload } from './jwt-payload.interface';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.jwtPubKey,
      algorithms: ['RS256'],
    });
  }

  async validate(payload: JWTPayload) {
    const user = await this.authService.validateUserByEmail(payload.sub);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
