import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  Post,
  Put,
  Request,
  Response,
  UseGuards,
} from '@nestjs/common';

import * as bcrypt from 'bcrypt';
import { promisify } from 'util';
import { ROUTES } from '@centrifuge/gateway-lib/utils/constants';
import { User } from '@centrifuge/gateway-lib/models/user';
import { DatabaseService } from '../database/database.service';
import config from '../config';
import { CentrifugeService } from '../centrifuge-client/centrifuge.service';
import { UserAuthGuard } from '../auth/admin.auth.guard';

@Controller()
export class UsersController {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly centrifugeService: CentrifugeService,
  ) {
  }

  @Post(ROUTES.USERS.login)
  @HttpCode(200)
  async login(@Body() user: User, @Request() req): Promise<User> {
    return req.user;
  }

  @Get(ROUTES.USERS.logout)
  async logout(@Request() req, @Response() res) {
    req.logout();
    return res.redirect('/');
  }

  @Get(ROUTES.USERS.base)
  @UseGuards(UserAuthGuard)
  async getAllUsers(@Request() request) {
    return await this.databaseService.users.find({});
  }

  @Post(ROUTES.USERS.base)
  async register(@Body() user: User) {

    const existingUser: User = await this.databaseService.users.findOne({
      email: user.email,
    });

    if (!user.password || !user.password.trim()) {
      throw new ForbiddenException('Password is mandatory');
    }

    if (config.inviteOnly) {
      if (existingUser && existingUser.invited && !existingUser.enabled) {
        return this.upsertUser({
            ...existingUser,
            password: user.password,
            enabled: true,
          },
          existingUser._id,
        );
      } else {
        throw new ForbiddenException('Email taken!');
      }
    } else {
      if (existingUser) {
        throw new ForbiddenException('Email taken!');
      }

      return this.upsertUser({
        ...user,
        enabled: true,
        invited: false,
      });
    }
  }

  @Post(ROUTES.USERS.invite)
  @UseGuards(UserAuthGuard)
  async invite(@Body() user: Partial<User>) {
    if (!config.inviteOnly) {
      throw new ForbiddenException('Invite functionality not enabled!');
    }
    const userExists = await this.databaseService.users.findOne({
      email: user.email,
    });

    if (userExists) {
      throw new ForbiddenException('User already invited!');
    }

    return this.upsertUser({
      ...user,
      name: user.name!,
      email: user.email,
      account: undefined,
      chain: undefined,
      password: undefined,
      enabled: false,
      invited: true,
      schemas: user.schemas,
      permissions: user.permissions,
    });
  }

  @Put(ROUTES.USERS.base)
  @UseGuards(UserAuthGuard)
  async update(@Body() user): Promise<User> {

    const otherUserWithEmail: User = await this.databaseService.users.findOne({
      email: user.email,
      $not: {
        _id: user._id,
      },
    });

    if (otherUserWithEmail) {
      throw new ForbiddenException('Email taken!');
    }

    return await this.databaseService.users.updateById(user._id,
      {
        $set: {
          name: user.name,
          email: user.email,
          permissions: user.permissions,
          schemas: user.schemas,
        },
      },
    );
  }

  private async upsertUser(user: User, id: string = '') {
    // Create centrifuge identity in case user does not have one
    if (!user.account) {
      const account = await this.centrifugeService.accounts.generateAccount(
          // @ts-ignore
          config.admin.chain,
      );
      user.account = account.identity_id.toLowerCase();
    }

    // Hash Password, and invited one should not have a password
    if (user.password) {
      user.password = await promisify(bcrypt.hash)(user.password, 10);
    }
    const result: User = await this.databaseService.users.updateById(id, user, true);
    return result;
  }
}
