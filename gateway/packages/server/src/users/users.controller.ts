import { Organization } from '@centrifuge/gateway-lib/models/organization'
import { LoggedInUser, PublicUser, TwoFaType, User, UserWithOrg } from '@centrifuge/gateway-lib/models/user'
import { ROUTES } from '@centrifuge/gateway-lib/utils/constants'
import { isPasswordValid } from '@centrifuge/gateway-lib/utils/validators'
import { MailerService } from '@nestjs-modules/mailer'
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  MethodNotAllowedException,
  Param,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import * as speakeasy from 'speakeasy'
import { promisify } from 'util'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { JWTPayload } from '../auth/jwt-payload.interface'
import { UserManagerAuthGuard } from '../auth/user-manager-auth.guard'
import { CentrifugeService } from '../centrifuge-client/centrifuge.service'
import config from '../config'
import { DatabaseService } from '../database/database.service'

@Controller()
export class UsersController {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly centrifugeService: CentrifugeService,
    private readonly jwtService: JwtService,
    private readonly mailerService: MailerService
  ) {}

  @Post(ROUTES.USERS.loginTentative)
  @HttpCode(200)
  async loginTentative(@Request() req): Promise<PublicUser> {
    let { user } = req
    if (user.twoFAType !== TwoFaType.APP) {
      if (!user.secret) {
        const secret = speakeasy.generateSecret()
        user = await this.upsertUser(
          {
            ...req.user,
            secret,
          },
          false
        )
      }
      const token = speakeasy.totp({
        secret: user.secret.base32,
        encoding: 'base32',
      })

      try {
        await this.mailerService.sendMail({
          to: user.email,
          subject: 'Centrifuge Gateway Account Verification',
          template: '2fa',
          context: {
            username: user.name,
            token,
          },
        })
      } catch (e) {
        console.log(e)
      }
    }
    return new PublicUser(user)
  }

  @Post(ROUTES.USERS.login)
  @HttpCode(200)
  async login(@Request() req): Promise<LoggedInUser> {
    const poolIds = await Promise.all(
      req.user.schemas.map(async (schema) => {
        const s = await this.databaseService.schemas.findOne({ name: schema })
        // TODO: after migration, introduce check if poolId is ETH address format
        return s.registries[0].tinlakePoolsMetadata?.poolId
      })
    )

    const accessToken = await this.jwtService.signAsync(
      {
        sub: req.user.email,
        poolIds,
      } as JWTPayload,
      { algorithm: 'RS256', secret: config.jwtPrivKey }
    )
    return {
      user: new PublicUser(req.user),
      token: accessToken,
    }
  }

  @Get('/api/users/profile')
  @UseGuards(JwtAuthGuard)
  async profile(@Request() req): Promise<PublicUser> {
    let { user } = req
    return new PublicUser(user)
  }

  @Get(ROUTES.USERS.base)
  @UseGuards(JwtAuthGuard, UserManagerAuthGuard)
  async getAllUsers(@Request() request) {
    const users = await this.databaseService.users.getCursor({}).sort({ createdAt: -1 }).exec()

    // sanitizes each user
    return users.map((user) => new PublicUser(user))
  }

  @Post(ROUTES.USERS.base)
  async register(@Body() user: User) {
    const existingUser: User = await this.databaseService.users.findOne({
      email: user.email.toLocaleLowerCase(),
    })

    if (!user.password || !user.password.trim()) {
      throw new MethodNotAllowedException('Password is mandatory')
    }
    if (!isPasswordValid(user.password)) {
      throw new MethodNotAllowedException('Password format is not valid')
    }

    if (config.inviteOnly) {
      if (existingUser && existingUser.invited && !existingUser.enabled) {
        return this.upsertUser(
          {
            ...existingUser,
            password: await promisify(bcrypt.hash)(user.password, 10),
            enabled: true,
          },
          false
        )
      } else if (existingUser) {
        throw new MethodNotAllowedException('Email taken!')
      } else {
        throw new MethodNotAllowedException('Pending invite required!')
      }
    } else {
      if (existingUser) {
        throw new MethodNotAllowedException('Email taken!')
      }
      return this.upsertUser(
        {
          ...user,
          email: user.email.toLocaleLowerCase(),
          enabled: true,
          invited: false,
        },
        true
      )
    }
  }

  @Post(ROUTES.USERS.invite)
  @UseGuards(JwtAuthGuard, UserManagerAuthGuard)
  async invite(@Body() user: Partial<User>) {
    if (!config.inviteOnly) {
      throw new MethodNotAllowedException('Invite functionality not enabled!')
    }
    const userExists = await this.databaseService.users.findOne({
      email: user.email,
    })

    if (userExists) {
      throw new MethodNotAllowedException('User already invited!')
    }

    const newUser = await this.upsertUser(
      {
        ...user,
        name: user.name!,
        email: user.email.toLowerCase(),
        account: user.account.toLowerCase(),
        chain: undefined,
        password: undefined,
        enabled: false,
        invited: true,
        secret: speakeasy.generateSecret(),
        twoFAType: user.twoFAType,
        schemas: user.schemas,
        permissions: user.permissions,
      },
      true
    )

    try {
      await this.mailerService.sendMail({
        to: user.email,
        subject: 'Welcome to Centrifuge Gateway',
        template: 'invite',
        context: {
          host: config.applicationHost,
          username: user.name,
          email: encodeURIComponent(user.email),
        },
      })
    } catch (e) {
      console.log(e)
    }

    return newUser
  }

  @Put(ROUTES.USERS.base)
  @UseGuards(JwtAuthGuard, UserManagerAuthGuard)
  async update(@Body() user): Promise<PublicUser> {
    const otherUserWithEmail: User = await this.databaseService.users.findOne({
      email: user.email.toLowerCase(),
      $not: {
        _id: user._id,
      },
    })

    if (otherUserWithEmail) {
      throw new MethodNotAllowedException('Email taken!')
    }

    return this.upsertUser(user, false)
  }

  @Delete(`${ROUTES.USERS.base}/:id`)
  @UseGuards(JwtAuthGuard, UserManagerAuthGuard)
  async remove(@Param() params): Promise<number> {
    return await this.databaseService.users.remove({
      _id: params.id,
    })
  }

  private async upsertUser(user: UserWithOrg, upsert: boolean = false) {
    // Create centrifuge identity in case user does not have one
    if (!user.account) {
      if (!user.organizationName) {
        throw new MethodNotAllowedException('Organization name is mandatory!')
      }
      const generatedAccount = await this.centrifugeService.accounts.generateAccountV2(config.admin.chain)

      const newOrg = new Organization(user.organizationName, generatedAccount.did.toLowerCase())
      await this.databaseService.organizations.insert(newOrg)
      delete user.organizationName
      user.account = newOrg.account
    }

    const result: User = await this.databaseService.users.updateById(user._id, user, upsert)

    return new PublicUser(result)
  }
}
