import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy as Passport2FAStrategy } from './passport-2fa';
import { AuthService } from './auth.service';

@Injectable()
export class TwoFAStrategy extends PassportStrategy(
  Passport2FAStrategy as any,
  '2fa',
) {
  constructor(private readonly authService: AuthService) {
    super({
      usernameField: 'email',
      passwordField: 'password',
      tokenField: 'token',
    });
  }

  /**
   * Validates a user by a specified email and password and totp token
   * @async
   * @param email
   * @param password
   * @param token
   */
  async validate(email: string, password: string, token: string) {
    const user = await this.authService.validateUserWithToken(
      email,
      password,
      token,
    );
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
