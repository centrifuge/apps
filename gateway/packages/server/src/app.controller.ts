import { PublicUser } from '@centrifuge/gateway-lib/models/user';
import { Controller, Get, Render, Request, Response } from '@nestjs/common';
import { AppService } from './app.service';
import config from './config';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('')
  @Render('index')
  root(@Request() req, @Response() res) {
    return {
      preloaderState: this.appService.preloadReduxStore(
        new PublicUser(req.user),
      ),
      ethNetwork: config.ethNetwork,
    };
  }

  @Get('api/public-key')
  publicKey() {
    return config.jwtPubKey;
  }
}
