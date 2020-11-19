import {
  Body,
  Controller,
  Delete,
  MethodNotAllowedException,
  Get,
  HttpCode, Param,
  Post,
  Put,
  Request,
  Response,
  UseGuards,
} from '@nestjs/common';

import * as speakeasy from 'speakeasy';
import * as bcrypt from 'bcrypt';
import { promisify } from 'util';
import { ROUTES } from '@centrifuge/gateway-lib/utils/constants';
import { User, UserWithOrg } from '@centrifuge/gateway-lib/models/user';
import { DatabaseService } from '../database/database.service';
import config from '../config';
import { CentrifugeService } from '../centrifuge-client/centrifuge.service';
import { UserAuthGuard } from '../auth/admin.auth.guard';
import { isPasswordValid } from '@centrifuge/gateway-lib/utils/validators';
import { Organization } from '@centrifuge/gateway-lib/models/organization';
import { MailerService } from '@nestjs-modules/mailer';

@Controller()
export class UsersController {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly centrifugeService: CentrifugeService,
    private readonly mailerService: MailerService,
  ) {}

  @Post(ROUTES.USERS.generateToken)
  @HttpCode(200)
  async generateToken(@Request() req): Promise<User> {
    let { user } = req;
    if (!user.secret) {
      const secret = speakeasy.generateSecret();
      user = await this.upsertUser(
        {
          ...req.user,
          secret,
        },
        false,
      );
    }

    const token = speakeasy.totp({
      secret: user.secret.base32,
      encoding: 'base32',
    });

    try {
      await this.mailerService.sendMail({
        to: user.email,
        subject: 'Centrifuge Gateway Account Verification',
        template: '2fa',
        context: {
          username: user.name,
          token,
        },
      });
    } catch (e) {
      console.log(e);
    }
    return user;
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
      email: user.email.toLocaleLowerCase(),
    });

    if (!user.password || !user.password.trim()) {
      throw new MethodNotAllowedException('Password is mandatory');
    }
    if (!isPasswordValid(user.password)) {
      throw new MethodNotAllowedException('Password format is not valid');
    }

    if (config.inviteOnly) {
      if (existingUser && existingUser.invited && !existingUser.enabled) {
        return this.upsertUser(
          {
            ...existingUser,
            password: await promisify(bcrypt.hash)(user.password, 10),
            enabled: true,
          },
          false,
        );
      } else {
        throw new MethodNotAllowedException('Email taken!');
      }
    } else {
      if (existingUser) {
        throw new MethodNotAllowedException('Email taken!');
      }
      return this.upsertUser(
        {
          ...user,
          email: user.email.toLocaleLowerCase(),
          enabled: true,
          invited: false,
        },
        true,
      );
    }
  }

  @Post(ROUTES.USERS.invite)
  @UseGuards(UserAuthGuard)
  async invite(@Body() user: Partial<User>) {
    if (!config.inviteOnly) {
      throw new MethodNotAllowedException('Invite functionality not enabled!');
    }
    const userExists = await this.databaseService.users.findOne({
      email: user.email,
    });

    if (userExists) {
      throw new MethodNotAllowedException('User already invited!');
    }

    const newUser = this.upsertUser(
      {
        ...user,
        name: user.name!,
        email: user.email.toLowerCase(),
        account: user.account.toLowerCase(),
        chain: undefined,
        password: undefined,
        enabled: false,
        invited: true,
        schemas: user.schemas,
        permissions: user.permissions,
      },
      true,
    );

    try {
      await this.mailerService.sendMail({
        to: user.email,
        subject: 'Welcome to Centrifuge Gateway',
        template: 'invite',
        context: {
          host: config.applicationHost,
          username: user.name,
          email: user.email,
        },
      });
    } catch (e) {
      console.log(e);
    }

    return newUser;
  }

  @Put(ROUTES.USERS.base)
  @UseGuards(UserAuthGuard)
  async update(@Body() user): Promise<User> {
    const otherUserWithEmail: User = await this.databaseService.users.findOne({
      email: user.email.toLowerCase(),
      $not: {
        _id: user._id,
      },
    });

    if (otherUserWithEmail) {
      throw new MethodNotAllowedException('Email taken!');
    }

    return await this.upsertUser(user, false);
  }

  @Delete(`${ROUTES.USERS.base}/:id`)
  @UseGuards(UserAuthGuard)
  async remove( @Param() params): Promise<number> {
    return await this.databaseService.users.remove({
      _id: params.id,
    });
  }

  private async upsertUser(user: UserWithOrg, upsert: boolean = false) {
    // Create centrifuge identity in case user does not have one
    if (!user.account) {
      if (!user.organizationName) {
        throw new MethodNotAllowedException('Organization name is mandatory!');
      }
      const generatedAccount = await this.centrifugeService.accounts.generateAccount(
        config.admin.chain,
      );

      const newOrg = new Organization(
        user.organizationName,
        generatedAccount.identity_id.toLowerCase(),
      );
      await this.databaseService.organizations.insert(newOrg);
      delete user.organizationName;
      user.account = newOrg.account;
    }

    const result: User = await this.databaseService.users.updateById(
      user._id,
      user,
      upsert,
    );
    return result;
  }
}
