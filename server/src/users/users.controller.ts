import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Request,
  Response,
} from '@nestjs/common';
import { ROUTES } from '../../../src/common/constants';
import { User } from '../../../src/common/models/dto/user';

@Controller(ROUTES.USERS.base)
export class UsersController {
  @Post('login')
  @HttpCode(200)
  async login(@Body() user: User) {
    return 'OK';
  }

  @Get('logout')
  async logout(@Request() req, @Response() res) {
    req.logout();
    return res.redirect('/');
  }
}
